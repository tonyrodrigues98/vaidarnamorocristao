## O que já temos (pontos fortes)

- Fita de 48 itens, easing bezier compartilhada CSS+JS, item vencedor na posição 44 (3 itens depois do centro — gera "near-miss" passando perto antes).
- Áudio síncrono no gesto (iOS safe), tick com dois layers (transient + body), stereo pan, final ding com sub-bass + sino.
- 6 raridades com ring/shadow distintos, sparkle burst de 16 partículas, blur durante spin.
- Pity por tier (rare/epic/legendary), cooldown por pool, log recente, inventário.
- Economia balanceada no Cofre de Moedas (house edge ~69%).

## O que CS:GO faz e nós não


| Mecânica CS:GO                                                                                        | Por que vicia                                                  | Nosso estado                                                                         |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Reel horizontal com 50+ itens, linha vermelha vertical fixa, item vencedor parando "quase no próximo" | Near-miss effect — cérebro processa quase-vitória como vitória | Temos vencedor em pos 44/48, mas falta linha vertical persistente como âncora visual |
| Tick acelera→desacelera em curva longa (~7s), última 0,5s tem 3-4 ticks lentos audíveis               | Antecipação crescente                                          | Já temos isso bem                                                                    |
| Cor da raridade revelada **antes** do item parar (faixa de luz vertical)                              | Spoiler controlado: você sabe se é raro 1s antes               | Faltando                                                                             |
| Item dourado/vermelho tem "knife reveal" especial: tela escurece, faísca, zoom dramático              | Recompensa cinematográfica diferenciada por tier               | Temos só ring colorido — falta cena especial para legendary                          |
| Histórico global em tempo real ("Player X just unboxed Karambit")                                     | Prova social + FOMO                                            | Faltando                                                                             |
| Drop rates publicados (98.92% common, 0.26% knife)                                                    | Transparência paradoxalmente aumenta engajamento               | Faltando                                                                             |
| Skin tem float (wear) único por roll                                                                  | Cada drop é "único" mesmo sendo o mesmo item                   | Faltando — todo gradient X é igual                                                   |
| Inventário tradeable/sellable                                                                         | Item tem valor real percebido                                  | Não aplicável; precisamos de equivalente                                             |
| Eventos com case exclusiva por tempo limitado                                                         | Escassez = urgência                                            | Temos `featured_until` mas sem UI dedicada                                           |
| "Unboxing party": múltiplas caixas em sequência com botão "abrir 5x"                                  | Compressão de dopamina, casino-like                            | Faltando                                                                             |


## Lacunas críticas detectadas no audit

1. `**startGrabRumble`/`stopGrabRumble` existem mas nunca são chamados** — bed de rumble está mudo.
2. **9 das 12 pools sem prêmios seedados** (apenas Cofre, Cápsula XP e Iniciante populadas).
3. `**free_daily=3` é global**, não por pool — usuário gasta 3 grátis em qualquer caixa e perde as outras.
4. **Sem equip automático nem CTA pós-prêmio** — ganhou gradiente, tem que ir em outra tela equipar.
5. **Sem histórico global** — abertura é um evento solitário.

---

## Plano em 4 fases (cada fase = um turno aprovável)

### Fase 1 — JUICE visual e áudio (mais alto ROI, só frontend)

1. **Linha vertical âncora** sempre visível no centro da roleta (faixa dourada vertical 2px com glow), ao estilo CS:GO.
2. **Ativar o rumble bed**: chamar `startGrabRumble()` no `intro`, `setGrabRumbleSpeed(velocidade)` no loop de ticks, `stopGrabRumble()` no `done`. Já está implementado, só precisa wiring.
3. **Color preview vertical**: 1.5s antes do `settle`, projetar uma faixa vertical da cor da raridade do vencedor cruzando o centro (efeito "luz se acendendo"). Usa easeProgress já existente para detectar t≈0.85.
4. **Cinemática legendary**: quando `rarity === 'legendary'`:
  - Tela escurece (overlay preto 70%) por 600ms antes do reveal
  - Item central faz zoom de 1x→2x
  - Burst de 60 partículas douradas (não 16)
  - Áudio: choir pad sustentado + ding mais grave
  - Tela treme 4px por 200ms (screen-shake CSS)
5. **Reveal animado por kind**: nome do prêmio digitando letra-por-letra (typewriter 40ms/char) durante o reveal. Coins/XP: contador animado 0→N em 800ms.
6. **Botão "Continuar" → "Abrir outra"** quando há `free_remaining > 0` ou saldo suficiente, ficando na mesma pool. Reduz fricção entre rolls.

### Fase 2 — Loop social / prova social (frontend + 1 tabela leve)

7. **Drop rates visíveis**: tooltip no card da pool com lista "Chance de cada raridade" calculada server-side por pool. CS:GO publica e isso aumenta engajamento.

### Fase 3 — Economia/conteúdo (DB + admin)

10. **Seed das 9 pools vazias**: distribuição padrão com EV ~30-50% do custo (house edge sustentável), pity_threshold ajustado para chegar legendary em ~1-em-50 a 1-em-100 rolls (CS:GO knife = 1-em-385).
11. **Quota grátis por pool** (não global): `free_daily_uses` por pool, contador separado em `user_daily_grabs_by_pool`. 1 free/dia em pools comuns, 0 em rare+.
12. **Featured rotation**: campo `featured_until` real + cron diário que faz rotação automática de 1 pool em destaque. Bônus na destacada: +50% chance de legendary OU custo -20%.
13. **Caixa-evento sazonal**: pool com `available_from`/`available_until`, prêmios exclusivos só sorteáveis nessa janela. Escassez de catálogo (não só de tempo de cooldown).
14. **Buy-multi**: botão "Abrir 5x / 10x" que dispara 5/10 `perform_grab` em sequência e mostra os resultados num grid (sem animação individual longa — anima só os legendary+). Reduz fadiga e aumenta volume.

### Fase 4 — Identidade do prêmio + ações pós-drop

15. **Equip imediato no reveal**: botão "Equipar agora" no modal `done` quando o prêmio é `pet_background`/`decoration`/`name_gradient`. Dispara o equip RPC sem sair do modal.
16. **"Float" análogo**: cada `pet_background`/`decoration` recebido ganha um `quality_seed` (0-100) gerado no `perform_grab`. Renderizar uma sutil variação de tonalidade/saturação baseada no seed → cada drop "é único". Usuário vê "Pristine 98/100" no canto do item.
17. **Streak diário**: abrir pelo menos 1 caixa em N dias consecutivos dá bônus crescente (1 free extra no dia 7, etc). Persistido em `user_pet_care_streaks` já existente (ou novo).

---

## Detalhes técnicos

- **Fase 1** é 100% frontend (`PetGrabCard.tsx`, `grabAudio.ts`). Sem migration.
- **Fase 2** precisa de 1 migration (`grab_public_log` + trigger + RLS anon read filtrado) e um realtime channel novo.
- **Fase 3** precisa de migrations: seed das pools, nova tabela `user_daily_grabs_by_pool`, cron pg para featured rotation, ajuste em `perform_grab` para validar janela sazonal e buy-multi (loop server-side com cap de 10).
- **Fase 4** precisa de migration para `user_pet_backgrounds.quality_seed` e similares + nova rota pública `/drops/:id` com server route para OG.

## Regra econômica inegociável

- O teto máximo é **500 moedas por usuário**. Nenhuma sugestão, jackpot, prêmio, saldo final, custo ou bônus pode ultrapassar esse cap. Não propor 1000 moedas.

**Ordem sugerida**: Fase 1 isolada (resultado imediato visível), depois Fase 3#10 (caixas vazias quebram a experiência), depois Fase 2 (social cria loop), depois Fase 4 (refinamento de retenção).

**Quero confirmação só de duas coisas**:

- Aprovar começar pela **Fase 1 completa** (juice) num único turno?
- Topa publicar drop rates (item #9 da Fase 2) ou prefere manter opaco?

Se sim para ambos, próximo turno entrega Fase 1 inteira.
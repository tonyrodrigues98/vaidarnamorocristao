# Observabilidade e alertas

## Estado

Contrato e runbook definidos; nenhum fornecedor externo foi configurado. A
ativação depende de owner, endpoint, retenção e autorização.

O contrato provider-neutral está em
`src/v2/platform/observability/release-telemetry.ts`. Ele aceita apenas campos
tipados e allowlisted, remove query/fragmento, reduz IDs de rota a `:id`,
rejeita rotas externas e fixa retenção técnica máxima de 30 dias. Os testes em
`tests/release-observability-v2.test.ts` comprovam que e-mail, mensagem e tokens
extras não entram no evento sanitizado. O módulo não transmite dados.

## Envelope mínimo sem PII

- timestamp, ambiente, versão/build e domínio;
- evento categórico e severidade;
- rota normalizada, nunca query string;
- correlation ID aleatório e efêmero;
- duração, status HTTP agrupado e retry count;
- capability/role categórica, nunca user ID;
- coorte agregada, nunca lista de usuários.

Proibidos: mensagem, oração, denúncia, perfil, nome, e-mail, telefone, token,
cookie, IP completo, documento, URL assinada, mídia, OAuth payload e segredo.

## Sinais e alertas

| Área      | Sinal                      | Atenção              | Crítico/segurança            | Owner              |
| --------- | -------------------------- | -------------------- | ---------------------------- | ------------------ |
| frontend  | error rate, p95, build     | +50% do baseline     | tela branca/loop Auth        | frontend/SRE       |
| Auth      | login/refresh/logout       | SLO degradado 10 min | acesso cruzado/token exposto | identidade         |
| banco/RLS | 401/403/500, slow query    | aumento sustentado   | bypass ou schema drift       | DBA/segurança      |
| Storage   | upload/download/órfão      | falha >2%            | mídia privada exposta        | mídia              |
| Realtime  | disconnect/lag/duplicate   | lag > SLO            | mensagem cruzada             | conversas          |
| push      | backlog/lease/retry/HTTP   | backlog crescente    | 401/503 ou job duplicado     | operações          |
| economia  | idempotência/reconciliação | atraso               | qualquer divergência         | economia/segurança |
| moderação | fila/tempo de resposta     | backlog > capacidade | fila parada/abuso grave      | trust              |
| PWA       | SW version/update/cache    | clientes defasados   | cache privado cruzado        | frontend           |
| backup    | idade/restore              | backup atrasado      | restore falhou               | DBA                |

Cada alerta precisa de owner, ação, janela, deduplicação e link para runbook.
Retenção proposta: erro técnico 30 dias; segurança 180 dias com acesso restrito;
agregados sem PII 13 meses. Exige validação jurídica.

## Health checks

- frontend e build commit;
- Auth local/isolado;
- query trivial ao banco;
- bucket de teste dedicado;
- Edge Function crítica com payload sintético;
- canal Realtime sintético;
- versão esperada do schema;
- job push único e resposta HTTP real.

Health checks não usam conta real nem service role no navegador.

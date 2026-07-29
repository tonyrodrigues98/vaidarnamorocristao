# Contrato de tema

## Estado

- `preference`: escolha persistida — `system`, `light` ou `dark`.
- `resolvedTheme`: tema efetivamente aplicado — `light` ou `dark`.
- `theme`: alias retrocompatível de `resolvedTheme`.
- `setTheme(preference)`: persiste e aplica sem reload.
- `toggle()`: parte do tema resolvido e grava a escolha explícita oposta.

## Persistência e resolução

A chave legada continua sendo `localStorage.theme`. Valores antigos `light` e `dark` permanecem
válidos. Ausência, erro de leitura ou valor inválido normalizam para `system`.

No modo `system`, o provider observa `(prefers-color-scheme: dark)` e remove o listener no cleanup.
Preferências explícitas ignoram mudanças do sistema. Eventos `storage` atualizam outras abas sem
reescrever a chave e sem criar loop.

## Aplicação no documento

O tema resolvido controla:

- classe `dark`, somente no tema escuro;
- `data-theme="light|dark"`;
- `data-theme-preference="system|light|dark"`;
- `style.colorScheme`;
- a única meta técnica `meta[name="theme-color"]`.

As cores da meta continuam sendo `brand.theme.canvasLight` e `brand.theme.canvasDark`. Os tokens
isolados do futuro Native Shell não são importados nem ativados.

## Bootstrap e splash

`getThemeBootstrapScript()` é injetado no `RootShell` depois dos metadados e antes do `body`. Ele
lê, normaliza, resolve e aplica o tema antes da primeira pintura, tolerando falhas de storage e
`matchMedia`. O elemento `html` suprime apenas a divergência esperada dos atributos aplicados antes
da hidratação.

O splash preserva estrutura, logo, duração e remoção. Apenas seu CSS inline acompanha `html.dark`
ou `data-theme="dark"` para evitar canvas branco no modo escuro.

## Conta e compatibilidade

`/conta` oferece Sistema, Claro e Escuro em um grupo acessível de três opções com alvos mínimos de
44 px. O texto informa que Sistema acompanha o dispositivo e mostra o tema atualmente resolvido.

Consumidores legados do Header continuam lendo `theme` e usando `toggle()`. O runtime V2 ainda
compila porque `setTheme` aceita `light` e `dark`, mas nenhum App Shell, rota ou token V2 foi
ativado nesta tarefa.

## Limitações

- O tema escuro da referência visual permanece `not-frozen`.
- A fundação é funcional, mas várias páginas V1 ainda possuem superfícies claras hardcoded.
- A auditoria detalhada está em `14-theme-compatibility-audit.md`; ela não equivale a aprovação
  visual das rotas.

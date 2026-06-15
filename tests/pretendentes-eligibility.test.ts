/**
 * Garante que as regras de elegibilidade do perfil em /pretendentes/$id
 * NÃO bloqueiam interações quando o perfil visualizado é staff
 * (moderador, admin, apresentador) que optou por aparecer na lista.
 *
 * A regra antiga escondia ações primárias (mensagem anônima, presente,
 * etc.) quando o alvo tinha cargo e o visitante não era admin. Como
 * staff só aparece na lista quando opta por aparecer, deve ser tratado
 * como qualquer outro perfil para fins de interação.
 */
import { describe, it, expect } from "vitest";
import { shouldHidePrimaryActions } from "../src/lib/pretendentesEligibility";

describe("shouldHidePrimaryActions — elegibilidade vs cargo", () => {
  it("oculta quando ambos têm o mesmo sexo (regra geral mantida)", () => {
    expect(
      shouldHidePrimaryActions({ viewerSex: "masculino", profileSex: "masculino" }),
    ).toBe(true);
    expect(
      shouldHidePrimaryActions({ viewerSex: "feminino", profileSex: "feminino" }),
    ).toBe(true);
  });

  it("NÃO oculta para sexo oposto, mesmo sem cargo", () => {
    expect(
      shouldHidePrimaryActions({ viewerSex: "masculino", profileSex: "feminino" }),
    ).toBe(false);
    expect(
      shouldHidePrimaryActions({ viewerSex: "feminino", profileSex: "masculino" }),
    ).toBe(false);
  });

  describe("staff que optou por aparecer na lista", () => {
    const cases: Array<{ role: "admin" | "super_admin" | "moderador" | "apresentador" }> = [
      { role: "admin" },
      { role: "super_admin" },
      { role: "moderador" },
      { role: "apresentador" },
    ];

    for (const { role } of cases) {
      it(`não bloqueia interação com perfil ${role} para visitante comum (sexo oposto)`, () => {
        expect(
          shouldHidePrimaryActions({
            viewerSex: "masculino",
            profileSex: "feminino",
            profileRole: role,
            viewerIsAdmin: false,
          }),
        ).toBe(false);
      });

      it(`não bloqueia interação com perfil ${role} mesmo se visitante for admin`, () => {
        expect(
          shouldHidePrimaryActions({
            viewerSex: "feminino",
            profileSex: "masculino",
            profileRole: role,
            viewerIsAdmin: true,
          }),
        ).toBe(false);
      });

      it(`ainda aplica a regra de mesmo sexo quando o perfil ${role} é do mesmo sexo`, () => {
        expect(
          shouldHidePrimaryActions({
            viewerSex: "masculino",
            profileSex: "masculino",
            profileRole: role,
            viewerIsAdmin: false,
          }),
        ).toBe(true);
      });
    }
  });

  it("retorna false quando algum dos sexos é desconhecido", () => {
    expect(shouldHidePrimaryActions({ viewerSex: null, profileSex: "feminino" })).toBe(false);
    expect(shouldHidePrimaryActions({ viewerSex: "masculino", profileSex: null })).toBe(false);
  });
});
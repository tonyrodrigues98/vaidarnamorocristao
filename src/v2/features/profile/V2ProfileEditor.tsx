import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw, Save, X } from "lucide-react";
import { V2Button, V2Heading, V2Text } from "@/v2/design-system";
import {
  moveProfileModule,
  profileModuleTitle,
  updateProfileModule,
  type ProfileAudience,
  type ProfileModule,
} from "./contracts";

const AUDIENCES: readonly { value: ProfileAudience; label: string }[] = [
  { value: "public", label: "Público" },
  { value: "community", label: "Comunidade" },
  { value: "connections", label: "Conexões" },
  { value: "private", label: "Somente eu" },
];

export function V2ProfileEditor({
  modules,
  saving,
  onChange,
  onSave,
  onCancel,
  onRestore,
}: {
  readonly modules: readonly ProfileModule[];
  readonly saving: boolean;
  readonly onChange: (modules: readonly ProfileModule[]) => void;
  readonly onSave: () => void;
  readonly onCancel: () => void;
  readonly onRestore: () => void;
}) {
  return (
    <aside className="vdn-v2-profile-editor" aria-labelledby="profile-editor-title">
      <header>
        <div>
          <V2Heading id="profile-editor-title" level={2} size="small">
            Organizar perfil
          </V2Heading>
          <V2Text variant="caption" tone="muted">
            Use os botões para reordenar. Arrastar nunca é obrigatório.
          </V2Text>
        </div>
        <V2Button variant="ghost" size="small" leadingIcon={<X />} onClick={onCancel}>
          Fechar
        </V2Button>
      </header>
      <ol className="vdn-v2-profile-editor__list">
        {modules.map((module, index) => (
          <li key={module.type}>
            <strong>{profileModuleTitle(module.type)}</strong>
            <div className="vdn-v2-profile-editor__controls">
              <V2Button
                variant="ghost"
                size="small"
                leadingIcon={<ArrowUp />}
                disabled={index === 0}
                onClick={() => onChange(moveProfileModule(modules, module.type, -1))}
              >
                Subir
              </V2Button>
              <V2Button
                variant="ghost"
                size="small"
                leadingIcon={<ArrowDown />}
                disabled={index === modules.length - 1}
                onClick={() => onChange(moveProfileModule(modules, module.type, 1))}
              >
                Descer
              </V2Button>
              <V2Button
                variant="ghost"
                size="small"
                leadingIcon={module.visible ? <Eye /> : <EyeOff />}
                onClick={() =>
                  onChange(updateProfileModule(modules, module.type, { visible: !module.visible }))
                }
              >
                {module.visible ? "Ocultar" : "Mostrar"}
              </V2Button>
              <label>
                <span>Audiência</span>
                <select
                  value={module.audience}
                  onChange={(event) =>
                    onChange(
                      updateProfileModule(modules, module.type, {
                        audience: event.currentTarget.value as ProfileAudience,
                      }),
                    )
                  }
                >
                  {AUDIENCES.map((audience) => (
                    <option key={audience.value} value={audience.value}>
                      {audience.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </li>
        ))}
      </ol>
      <footer>
        <V2Button variant="outline" leadingIcon={<RotateCcw />} onClick={onRestore}>
          Restaurar padrão
        </V2Button>
        <V2Button loading={saving} leadingIcon={<Save />} onClick={onSave}>
          Salvar perfil
        </V2Button>
      </footer>
    </aside>
  );
}

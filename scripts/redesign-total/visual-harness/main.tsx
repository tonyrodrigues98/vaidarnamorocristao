/* eslint-disable react-refresh/only-export-components -- isolated visual QA entry */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { createRoot } from "react-dom/client";

import type { NativeConversationsViewModel } from "@/components/conversations/native/NativeConversationsView";
import type { NativeInicioViewModel } from "@/components/home/native/NativeInicioView";
import { RedesignAppFrame } from "@/components/redesign-total/RedesignAppFrame";
import { RedesignCommunityView } from "@/components/redesign-total/community/RedesignCommunityView";
import { RedesignConversationsView } from "@/components/redesign-total/conversations/RedesignConversationsView";
import { RedesignExploreView } from "@/components/redesign-total/explore/RedesignExploreView";
import { RedesignInicioView } from "@/components/redesign-total/home/RedesignInicioView";
import { RedesignProfileHero } from "@/components/redesign-total/profile/RedesignProfileHero";
import { RedesignProfileTabs } from "@/components/redesign-total/profile/RedesignProfileTabs";
import { nativeExploreRegistry } from "@/config/native-explore-registry";
import type { FuturePrimaryTab } from "@/config/app-destinations";

import "@/styles.css";
import "@/styles/redesign-total.tokens.css";
import "@/styles/redesign-total.frame.css";
import "@/styles/redesign-total.roots.css";
import "./visual-harness.css";

const params = new URLSearchParams(window.location.search);
const surface = params.get("surface") ?? "inicio";
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const routes = {
  inicio: { path: "/inicio", tab: "home", destinationId: "app-home" },
  comunidade: {
    path: "/comunidade",
    tab: "community",
    destinationId: "compatibility-community",
  },
  explorar: { path: "/explorar", tab: "explore", destinationId: "app-explore" },
  conversas: {
    path: "/conversas",
    tab: "messages",
    destinationId: "app-conversations",
  },
  perfil: { path: "/perfil", tab: "profile", destinationId: "app-profile" },
} as const;

const homeModel: NativeInicioViewModel = {
  status: "approved",
  firstName: "Ana",
  greeting: "Boa tarde, Ana",
  greetingDetail: "Um espaço leve para fé, comunidade e novas conexões.",
  bannedReason: null,
  rejectionReason: null,
  warnings: [],
  requests: [],
  latestAppeal: null,
  latestRejectionAppeal: null,
  canAppeal: false,
  canReverify: false,
  appealText: "",
  appealBusy: false,
  devotional: {
    title: "Caminhe com esperança",
    bibleReference: "Romanos 12:12",
    bibleText: "Alegrem-se na esperança, sejam pacientes na tribulação, perseverem na oração.",
  },
  strength: 78,
  strengthLabel: "Seu perfil está ganhando forma",
  nextProfileAction: {
    title: "Conte mais sobre sua caminhada",
    description: "Complete sua bio para apresentar sua história com autenticidade.",
  },
  unreadConversations: 3,
  newProfiles: 8,
  suggestion: { id: "fixture", firstName: "Marina", age: 29, location: "Curitiba · PR" },
  commitment: null,
  onAppealTextChange() {},
  onAcknowledgeWarning() {},
  onResolveRequest() {},
  onSubmitAppeal() {},
};

const conversationModel: NativeConversationsViewModel = {
  query: "",
  items: [
    {
      matchId: "fixture-1",
      partner: {
        id: "person-1",
        full_name: "Marina Alves",
        photo_url: null,
        city: "Curitiba",
        state: "PR",
        verified: true,
      },
      lastMessage: "Que bom conversar com você!",
      lastAt: "2026-08-03T15:20:00.000Z",
      unread: true,
    },
    {
      matchId: "fixture-2",
      partner: {
        id: "person-2",
        full_name: "Beatriz Lima",
        photo_url: null,
        city: "Campinas",
        state: "SP",
      },
      lastMessage: "Até mais tarde.",
      lastAt: "2026-08-02T18:45:00.000Z",
      unread: false,
    },
  ],
  filteredItems: [],
  showCommunity: true,
  loading: false,
  refreshing: false,
  online: true,
  activeCommitment: null,
  onQueryChange() {},
  onRefresh() {},
};
conversationModel.filteredItems = conversationModel.items;

function ProfileFixture() {
  return (
    <main className="rd-page rd-profile-harness" data-vdn-total-redesign-profile>
      <RedesignProfileHero
        photoUrl={null}
        name="Ana Ribeiro"
        status="Aprovado"
        contributor
        age={31}
        state="SP"
        range="28-38"
        location="São Paulo, SP"
        church="Igreja Batista Central"
        baptism="8 anos"
        strength={86}
        strengthLabel="Perfil forte"
        userId="fixture"
        onPhotoClick={() => {}}
      />
      <RedesignProfileTabs
        activeTab="profile"
        items={[
          { value: "profile", label: "Perfil" },
          { value: "prefs", label: "Preferências" },
          { value: "customizacao", label: "Visual" },
          { value: "saldo", label: "Moedas" },
        ]}
        onTabChange={() => {}}
      />
      <section className="rd-profile-panel">
        <h2>Sobre mim</h2>
        <p>Gosto de conversas sinceras, servir na comunidade e viver a fé no cotidiano.</p>
      </section>
    </main>
  );
}

function Surface() {
  if (surface === "comunidade") return <RedesignCommunityView activeTab="agora" />;
  if (surface === "explorar") return <RedesignExploreView items={nativeExploreRegistry} />;
  if (surface === "conversas") return <RedesignConversationsView model={conversationModel} />;
  if (surface === "perfil") return <ProfileFixture />;
  return <RedesignInicioView model={homeModel} />;
}

function App() {
  const route = routes[surface as keyof typeof routes] ?? routes.inicio;
  const width = window.innerWidth;
  const height = window.innerHeight;
  return (
    <QueryClientProvider client={queryClient}>
      <RedesignAppFrame
        activeTab={route.tab as FuturePrimaryTab}
        pathname={route.path}
        destinationId={route.destinationId}
        userLabel="Ana Ribeiro"
        viewportState={{
          width,
          layoutHeight: height,
          visualHeight: height,
          keyboardHeight: 0,
          keyboardOpen: false,
          orientation: width > height ? "landscape" : "portrait",
          compact: width < 768,
        }}
      >
        <Surface />
      </RedesignAppFrame>
    </QueryClientProvider>
  );
}

const rootRoute = createRootRoute({ component: App });
const router = createRouter({
  routeTree: rootRoute,
  history: createMemoryHistory({ initialEntries: ["/"] }),
});

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);

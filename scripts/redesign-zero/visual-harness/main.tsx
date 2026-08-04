/* eslint-disable react-refresh/only-export-components -- isolated visual QA entry */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { createRoot } from "react-dom/client";

import type { NativeConversationsViewModel } from "@/components/conversations/native/native-conversations-model";
import type { NativeInicioViewModel } from "@/components/home/native/native-inicio-model";
import { RedesignAppFrame } from "@/components/redesign-total/RedesignAppFrame";
import { VisualZeroCommunity } from "@/components/redesign-zero/community/VisualZeroCommunity";
import { VisualZeroConversations } from "@/components/redesign-zero/conversations/VisualZeroConversations";
import { VisualZeroExplore } from "@/components/redesign-zero/explore/VisualZeroExplore";
import { VisualZeroInicio } from "@/components/redesign-zero/home/VisualZeroInicio";
import { VisualZeroProfile } from "@/components/redesign-zero/profile/VisualZeroProfile";
import { nativeExploreRegistry } from "@/config/native-explore-registry";
import type { FuturePrimaryTab } from "@/config/app-destinations";

import "@/styles.css";
import "@/styles/redesign-total.tokens.css";
import "@/styles/redesign-total.frame.css";
import "@/styles/redesign-zero.tokens.css";
import "@/styles/redesign-zero.frame.css";
import "@/styles/redesign-zero.surfaces.css";
import "./visual-harness.css";

const params = new URLSearchParams(window.location.search);
const surface = params.get("surface") ?? "inicio";
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const routes = {
  inicio: { path: "/inicio", tab: "home", destinationId: "app-home" },
  comunidade: { path: "/comunidade", tab: "community", destinationId: "compatibility-community" },
  explorar: { path: "/explorar", tab: "explore", destinationId: "app-explore" },
  conversas: { path: "/conversas", tab: "messages", destinationId: "app-conversations" },
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
    bibleText: "Alegrem-se na esperança, perseverem na oração.",
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
    <VisualZeroProfile
      userId="fixture"
      profile={{
        full_name: "Ana Ribeiro",
        age: "31",
        height_cm: "168",
        sex: "feminino",
        marital: "solteiro",
        city: "São Paulo",
        state: "SP",
        church: "Igreja Batista Central",
        years_baptized: "8",
        bio: "Gosto de conversas sinceras, servir na comunidade e viver a fé no cotidiano.",
      }}
      preferences={{
        age_min: "28",
        age_max: "38",
        location_scope: "brasil",
        custom_states: [],
        desired_quality: "Gentileza e propósito",
        accepts_children: "sim",
        looking_for_bio: "Uma relação séria, vivida com fé e respeito.",
      }}
      photoUrl={null}
      nameGradient={null}
      status="approved"
      activeTab="profile"
      online
      loading={false}
      stale={false}
      savingProfile={false}
      savingPreferences={false}
      commitment={null}
      isStaff={false}
      roleLabel="Usuário"
      roleColor="gold"
      availableRoleColors={[]}
      publicListing={false}
      savingRole={false}
      contributor
      contributorHighlight
      savingContributor={false}
      onTabChange={() => {}}
      onProfileFieldChange={() => {}}
      onPreferenceFieldChange={() => {}}
      onPhotoChange={() => {}}
      onSaveProfile={() => {}}
      onSavePreferences={() => {}}
      onRoleColorChange={() => {}}
      onPublicListingChange={() => {}}
      onSaveRole={() => {}}
      onContributorHighlightChange={() => {}}
    />
  );
}

function Surface() {
  if (surface === "comunidade") return <VisualZeroCommunity activeTab="agora" />;
  if (surface === "explorar") return <VisualZeroExplore items={nativeExploreRegistry} />;
  if (surface === "conversas") return <VisualZeroConversations model={conversationModel} />;
  if (surface === "perfil") return <ProfileFixture />;
  return <VisualZeroInicio model={homeModel} />;
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

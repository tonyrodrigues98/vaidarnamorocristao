import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { admin, createUser, deleteUsers, type Ctx } from "./helpers";

let owner: Ctx;
let other: Ctx;
let petId: string;

async function catalogId(table: string) {
  const { data, error } = await admin
    .from(table as never)
    .select("id")
    .limit(1)
    .single();
  if (error || !data) throw error ?? new Error(`missing catalog row: ${table}`);
  return (data as { id: string }).id;
}

beforeAll(async () => {
  owner = await createUser("trusted-reward-owner");
  other = await createUser("trusted-reward-other");

  const [categoryId, lifeStageId, personalityId] = await Promise.all([
    catalogId("pet_categories"),
    catalogId("pet_life_stages"),
    catalogId("pet_personalities"),
  ]);
  const { data: pet, error } = await admin
    .from("user_pets_v2")
    .insert({
      user_id: owner.userId,
      category_id: categoryId,
      life_stage_id: lifeStageId,
      personality_id: personalityId,
      custom_name: "Audit Pet",
    })
    .select("id")
    .single();
  if (error || !pet) throw error ?? new Error("pet setup failed");
  petId = pet.id;
});

afterAll(async () => {
  await deleteUsers(owner, other);
});

async function insertEligibleCareEvent() {
  const { data: state, error: stateError } = await admin
    .from("pet_care_state")
    .upsert(
      {
        user_pet_id: petId,
        kind: "feed",
        value_at_anchor: 25,
        anchor_at: new Date().toISOString(),
      },
      { onConflict: "user_pet_id,kind" },
    )
    .select("id")
    .single();
  if (stateError || !state) throw stateError ?? new Error("state setup failed");

  const { data: event, error: eventError } = await admin
    .from("pet_care_events")
    .insert({
      user_pet_id: petId,
      user_id: owner.userId,
      kind: "feed",
      delta: 10,
    })
    .select("id")
    .single();
  if (eventError || !event) throw eventError ?? new Error("event setup failed");
  return event.id;
}

describe("trusted reward capability ACL", () => {
  it.each([
    ["grant_coin_event", { _user: "", _amount: 999_999, _ref: "forged" }],
    ["award_xp", { _source: "forged", _amount: 999_999, _daily_cap: 999_999, _meta: {} }],
    ["track_achievement", { _user_id: "", _category: "care", _inc: 999_999, _action: "feed" }],
    ["progress_mission_action", { _user_id: "", _action_key: "care_action", _inc: 999_999 }],
    [
      "create_notification",
      {
        _user_id: "",
        _type: "forged",
        _title: "forged",
        _body: "forged",
        _link: "/inicio",
        _actor_id: null,
        _entity_id: null,
      },
    ],
  ])("denies authenticated direct execution of %s", async (functionName, args) => {
    const forged = Object.fromEntries(
      Object.entries(args).map(([key, value]) => [
        key,
        key === "_user" || key === "_user_id" ? other.userId : value,
      ]),
    );
    const { error } = await owner.client.rpc(functionName as never, forged as never);
    expect(error).toBeTruthy();
  });

  it("rejects another user's pet and values are not client parameters", async () => {
    const { error } = await other.client.rpc(
      "award_my_care_xp" as never,
      {
        _user_pet_id: petId,
      } as never,
    );
    expect(error).toBeTruthy();
  });

  it("awards a trusted event once under concurrent replay", async () => {
    await insertEligibleCareEvent();
    const [first, second] = await Promise.all([
      owner.client.rpc("award_my_care_xp" as never, { _user_pet_id: petId } as never),
      owner.client.rpc("award_my_care_xp" as never, { _user_pet_id: petId } as never),
    ]);

    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    const results = [first.data, second.data] as Array<{ granted: number; reason?: string }>;
    expect(results.filter((result) => result.granted > 0)).toHaveLength(1);
    expect(results.filter((result) => result.reason === "replay")).toHaveLength(1);
  });
});

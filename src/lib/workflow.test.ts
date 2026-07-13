import { describe, it, expect } from "vitest";
import { Role, TaskStatus } from "@prisma/client";
import { transitionError } from "./workflow";
describe("task workflow authorization", () => {
  it("prevents members approving work", () =>
    expect(
      transitionError(Role.TEAM_MEMBER, TaskStatus.IN_REVIEW, TaskStatus.DONE),
    ).toMatch(/manager/));
  it("requires review before manager approval", () =>
    expect(
      transitionError(
        Role.PROJECT_MANAGER,
        TaskStatus.IN_PROGRESS,
        TaskStatus.DONE,
      ),
    ).toMatch(/submitted/));
  it("blocks work with incomplete dependencies", () =>
    expect(
      transitionError(
        Role.PROJECT_MANAGER,
        TaskStatus.TODO,
        TaskStatus.IN_PROGRESS,
        true,
      ),
    ).toMatch(/dependencies/));
  it("allows managers to approve reviewed tasks", () =>
    expect(
      transitionError(
        Role.PROJECT_MANAGER,
        TaskStatus.IN_REVIEW,
        TaskStatus.DONE,
      ),
    ).toBeNull());
});

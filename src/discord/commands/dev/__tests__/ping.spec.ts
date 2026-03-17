import { describe, expect, it, mock } from "bun:test";
import { ChatInputCommandInteraction } from "discord.js";
import { execute } from "../ping";

describe("ping command", () => {
  it("should reply with 'pong'", async () => {
    const mockReply = mock(() => Promise.resolve());
    const mockInteraction = {
      reply: mockReply,
    } as unknown as ChatInputCommandInteraction;

    await execute(mockInteraction);

    expect(mockReply).toHaveBeenCalledTimes(1);
    expect(mockReply).toHaveBeenCalledWith("pong");
  });
});

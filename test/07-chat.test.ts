// Live chat lifecycle on devnet (legacy 1:1 chat). user2 only needs to be a
// distinct pubkey — the primary signs and pays for create/send/close:
//   create chat → send message → verify → close message → close chat.

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { Keypair } from "@solana/web3.js";

import { primaryClient, assertFunded, ensureProfile, uid } from "./helpers.js";

const T = { timeout: 90_000 };

describe("live: chat (devnet)", () => {
  const client = primaryClient();
  const me = client.walletPublicKey;
  const chatId = uid();
  const messageIndex = uid();
  const user2 = Keypair.generate().publicKey; // counterparty — never signs here

  before(async () => {
    await assertFunded(client);
    await ensureProfile(client, "sdktester", "SDK Tester", "live devnet suite");
  });

  after(async () => {
    await client.closeMessage({ chatId, messageIndex }).catch(() => {});
    await client.closeChat({ chatId }).catch(() => {});
  });

  test("createChat → reads back the two participants", T, async () => {
    const res = await client.createChat({ chatId, user2 });
    assert.ok(res.signature);

    const chat = await client.getChat(chatId);
    assert.ok(chat, "chat should exist");
    assert.equal(chat.user1.toBase58(), me.toBase58());
    assert.equal(chat.user2.toBase58(), user2.toBase58());
    assert.equal(chat.chatId.toString(), chatId.toString());
  });

  test("sendMessage → message reads back and message_count bumps", T, async () => {
    const content = `hello from the live suite ${messageIndex}`;
    await client.sendMessage({ chatId, messageIndex, content });

    const message = await client.getMessage(chatId, messageIndex);
    assert.ok(message, "message should exist");
    assert.equal(message.content, content);
    assert.equal(message.sender.toBase58(), me.toBase58());

    const chat = await client.getChat(chatId);
    assert.ok((chat?.messageCount.toNumber() ?? 0) >= 1);
  });

  test("close message → chat; both accounts are gone", T, async () => {
    await client.closeMessage({ chatId, messageIndex });
    assert.equal(await client.getMessage(chatId, messageIndex), null);

    await client.closeChat({ chatId });
    assert.equal(await client.getChat(chatId), null);
  });
});

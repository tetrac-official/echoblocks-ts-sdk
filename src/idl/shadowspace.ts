/**
 * Auto-generated TypeScript IDL for the ShadowSpace program.
 *
 * Source: the on-chain Anchor IDL of the devnet program
 * CKdp6xnNnsMk5NsyQU9YEVU88wHfDdLUep3eJz4VVMFh (fetched with `anchor idl fetch`,
 * see src/idl/shadowspace.json for the raw on-chain form), converted to camelCase
 * with Anchor's `convertIdlToCamelCase` so the type matches the namespaces the
 * `Program` runtime exposes (program.methods.createPost, program.account.profile, ...).
 *
 * Do not edit by hand. To update: re-fetch the IDL and regenerate.
 */

/* eslint-disable */
export type Shadowspace = {
  "accounts": [
    {
      "discriminator": [
        170,
        4,
        71,
        128,
        185,
        103,
        250,
        177
      ],
      "name": "chat"
    },
    {
      "discriminator": [
        150,
        135,
        96,
        244,
        55,
        199,
        50,
        65
      ],
      "name": "comment"
    },
    {
      "discriminator": [
        192,
        73,
        211,
        158,
        178,
        81,
        19,
        112
      ],
      "name": "community"
    },
    {
      "discriminator": [
        174,
        177,
        136,
        60,
        138,
        84,
        148,
        209
      ],
      "name": "followAccount"
    },
    {
      "discriminator": [
        179,
        237,
        53,
        5,
        91,
        236,
        161,
        50
      ],
      "name": "likeRecord"
    },
    {
      "discriminator": [
        231,
        141,
        180,
        98,
        109,
        168,
        175,
        166
      ],
      "name": "membership"
    },
    {
      "discriminator": [
        110,
        151,
        23,
        110,
        198,
        6,
        125,
        181
      ],
      "name": "message"
    },
    {
      "discriminator": [
        110,
        234,
        167,
        188,
        231,
        136,
        153,
        111
      ],
      "name": "poll"
    },
    {
      "discriminator": [
        60,
        154,
        212,
        155,
        112,
        25,
        150,
        182
      ],
      "name": "pollVote"
    },
    {
      "discriminator": [
        8,
        147,
        90,
        186,
        185,
        56,
        192,
        150
      ],
      "name": "post"
    },
    {
      "discriminator": [
        184,
        101,
        165,
        188,
        95,
        63,
        127,
        188
      ],
      "name": "profile"
    },
    {
      "discriminator": [
        226,
        61,
        100,
        191,
        223,
        221,
        142,
        139
      ],
      "name": "reaction"
    }
  ],
  "address": "CKdp6xnNnsMk5NsyQU9YEVU88wHfDdLUep3eJz4VVMFh",
  "errors": [
    {
      "code": 6000,
      "msg": "Already following this user",
      "name": "alreadyFollowing"
    },
    {
      "code": 6001,
      "msg": "Not following this user",
      "name": "notFollowing"
    },
    {
      "code": 6002,
      "msg": "Unauthorized",
      "name": "unauthorized"
    },
    {
      "code": 6003,
      "msg": "Content too long",
      "name": "contentTooLong"
    },
    {
      "code": 6004,
      "msg": "Cannot follow yourself",
      "name": "cannotFollowSelf"
    },
    {
      "code": 6005,
      "msg": "Invalid amount",
      "name": "invalidAmount"
    },
    {
      "code": 6006,
      "msg": "Community is full (max 100 members)",
      "name": "communityFull"
    },
    {
      "code": 6007,
      "msg": "Account already initialized",
      "name": "alreadyInitialized"
    },
    {
      "code": 6008,
      "msg": "Poll must have 2-4 options",
      "name": "invalidPollOptions"
    },
    {
      "code": 6009,
      "msg": "Invalid poll choice",
      "name": "invalidPollChoice"
    },
    {
      "code": 6010,
      "msg": "Poll has ended",
      "name": "pollAlreadyEnded"
    },
    {
      "code": 6011,
      "msg": "Already liked this post",
      "name": "alreadyLiked"
    },
    {
      "code": 6012,
      "msg": "Cannot like your own post",
      "name": "cannotLikeOwnPost"
    },
    {
      "code": 6013,
      "msg": "Invalid reaction type",
      "name": "invalidReactionType"
    }
  ],
  "instructions": [
    {
      "accounts": [
        {
          "name": "chat",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "chatId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "chatId",
          "type": "u64"
        }
      ],
      "discriminator": [
        182,
        227,
        125,
        158,
        213,
        132,
        147,
        192
      ],
      "docs": [
        "Close a legacy chat account and return rent"
      ],
      "name": "closeChat"
    },
    {
      "accounts": [
        {
          "name": "comment",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "post"
              },
              {
                "kind": "arg",
                "path": "commentIndex"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "post",
                "kind": "account",
                "path": "post.author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "commentIndex",
          "type": "u64"
        }
      ],
      "discriminator": [
        220,
        161,
        167,
        122,
        254,
        149,
        11,
        78
      ],
      "docs": [
        "Close a comment account and return rent"
      ],
      "name": "closeComment"
    },
    {
      "accounts": [
        {
          "name": "community",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "communityId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "communityId",
          "type": "u64"
        }
      ],
      "discriminator": [
        193,
        80,
        180,
        65,
        226,
        240,
        125,
        104
      ],
      "name": "closeCommunity"
    },
    {
      "accounts": [
        {
          "name": "message",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  115,
                  115,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "chatId"
              },
              {
                "kind": "arg",
                "path": "messageIndex"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "chatId",
          "type": "u64"
        },
        {
          "name": "messageIndex",
          "type": "u64"
        }
      ],
      "discriminator": [
        53,
        48,
        100,
        249,
        207,
        188,
        96,
        22
      ],
      "docs": [
        "Close a legacy message account and return rent"
      ],
      "name": "closeMessage"
    },
    {
      "accounts": [
        {
          "name": "poll",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  108
                ]
              },
              {
                "account": "poll",
                "kind": "account",
                "path": "poll.creator"
              },
              {
                "kind": "arg",
                "path": "pollId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        }
      ],
      "args": [
        {
          "name": "pollId",
          "type": "u64"
        }
      ],
      "discriminator": [
        139,
        213,
        162,
        65,
        172,
        150,
        123,
        67
      ],
      "name": "closePoll"
    },
    {
      "accounts": [
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        }
      ],
      "discriminator": [
        131,
        190,
        34,
        94,
        190,
        71,
        183,
        81
      ],
      "docs": [
        "Close a post account and return rent to the treasury"
      ],
      "name": "closePost"
    },
    {
      "accounts": [
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [],
      "discriminator": [
        167,
        36,
        181,
        8,
        136,
        158,
        46,
        207
      ],
      "docs": [
        "Close a profile account and return rent to the treasury"
      ],
      "name": "closeProfile"
    },
    {
      "accounts": [
        {
          "name": "reaction",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  97,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "post"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "post",
                "kind": "account",
                "path": "post.author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        }
      ],
      "discriminator": [
        92,
        52,
        140,
        129,
        113,
        132,
        43,
        244
      ],
      "docs": [
        "Close a reaction account and return rent"
      ],
      "name": "closeReaction"
    },
    {
      "accounts": [
        {
          "name": "chat",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "chatId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user1",
          "signer": true,
          "writable": true
        },
        {
          "name": "user2"
        },
        {
          "docs": [
            "Fee payer — treasury for gasless UX"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "chatId",
          "type": "u64"
        }
      ],
      "discriminator": [
        133,
        186,
        254,
        72,
        143,
        178,
        221,
        28
      ],
      "name": "createChat"
    },
    {
      "accounts": [
        {
          "name": "comment",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "post"
              },
              {
                "kind": "arg",
                "path": "commentIndex"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "post",
                "kind": "account",
                "path": "post.author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "commenterProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "commenterProfile.owner"
              }
            ]
          }
        },
        {
          "docs": [
            "The commenter — must be the commenter_profile owner"
          ],
          "name": "author",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "commentIndex",
          "type": "u64"
        },
        {
          "name": "content",
          "type": "string"
        }
      ],
      "discriminator": [
        236,
        232,
        11,
        180,
        70,
        206,
        73,
        145
      ],
      "name": "createComment"
    },
    {
      "accounts": [
        {
          "name": "community",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "communityId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "creatorProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "communityId",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "avatarUrl",
          "type": "string"
        }
      ],
      "discriminator": [
        203,
        214,
        176,
        194,
        13,
        207,
        22,
        60
      ],
      "name": "createCommunity"
    },
    {
      "accounts": [
        {
          "name": "poll",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  108
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "profile.owner"
              },
              {
                "kind": "arg",
                "path": "pollId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "pollId",
          "type": "u64"
        },
        {
          "name": "question",
          "type": "string"
        },
        {
          "name": "optionA",
          "type": "string"
        },
        {
          "name": "optionB",
          "type": "string"
        },
        {
          "name": "optionC",
          "type": "string"
        },
        {
          "name": "optionD",
          "type": "string"
        },
        {
          "name": "numOptions",
          "type": "u8"
        },
        {
          "name": "endsAt",
          "type": "i64"
        }
      ],
      "discriminator": [
        182,
        171,
        112,
        238,
        6,
        219,
        14,
        110
      ],
      "name": "createPoll"
    },
    {
      "accounts": [
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "profile.owner"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "profile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "docs": [
            "The post author — must be the profile owner"
          ],
          "name": "author",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "content",
          "type": "string"
        },
        {
          "name": "isPrivate",
          "type": "bool"
        }
      ],
      "discriminator": [
        123,
        92,
        184,
        29,
        231,
        24,
        15,
        202
      ],
      "name": "createPost"
    },
    {
      "accounts": [
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Fee payer — can be a server keypair for gasless UX"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "username",
          "type": "string"
        },
        {
          "name": "displayName",
          "type": "string"
        },
        {
          "name": "bio",
          "type": "string"
        }
      ],
      "discriminator": [
        225,
        205,
        234,
        143,
        17,
        186,
        50,
        220
      ],
      "name": "createProfile"
    },
    {
      "accounts": [
        {
          "docs": [
            "The post PDA — seeded by the author's pubkey, so only the real author's post is found"
          ],
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "docs": [
            "Must be the original author — if anyone else signs, the seed/constraint check fails"
          ],
          "name": "author",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "newContent",
          "type": "string"
        }
      ],
      "discriminator": [
        218,
        25,
        82,
        105,
        200,
        189,
        238,
        75
      ],
      "name": "editPost"
    },
    {
      "accounts": [
        {
          "name": "followAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  108,
                  108,
                  111,
                  119
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followerProfile.owner"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followingProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "followerProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "followingProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followingProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Fee payer — can be a server keypair for gasless UX"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [],
      "discriminator": [
        126,
        176,
        97,
        36,
        63,
        145,
        4,
        134
      ],
      "name": "followUser"
    },
    {
      "accounts": [
        {
          "name": "membership",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "community"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "memberProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "community",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "communityId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "memberProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "communityId",
          "type": "u64"
        }
      ],
      "discriminator": [
        252,
        106,
        147,
        30,
        134,
        74,
        28,
        232
      ],
      "name": "joinCommunity"
    },
    {
      "accounts": [
        {
          "name": "membership",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "community"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "memberProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "community",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "communityId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "memberProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "docs": [
            "Must be the profile owner — prevents others from kicking members"
          ],
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "communityId",
          "type": "u64"
        }
      ],
      "discriminator": [
        218,
        140,
        41,
        66,
        8,
        140,
        33,
        161
      ],
      "name": "leaveCommunity"
    },
    {
      "accounts": [
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "post",
                "kind": "account",
                "path": "post.author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "profile.owner"
              }
            ]
          }
        },
        {
          "docs": [
            "One LikeRecord PDA per (post, liker) — init will fail if they've already liked"
          ],
          "name": "likeRecord",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "post"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "docs": [
            "The liker — must be the profile owner (read-only, no SOL needed)"
          ],
          "name": "user",
          "signer": true
        },
        {
          "docs": [
            "Treasury pays for like_record rent"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        }
      ],
      "discriminator": [
        45,
        242,
        154,
        71,
        63,
        133,
        54,
        186
      ],
      "name": "likePost"
    },
    {
      "accounts": [
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [],
      "discriminator": [
        224,
        187,
        132,
        189,
        185,
        163,
        183,
        237
      ],
      "docs": [
        "Resize an existing profile account to the current schema size.",
        "This is needed when the Profile struct grows (e.g. adding follower/following counts)."
      ],
      "name": "migrateProfile"
    },
    {
      "accounts": [
        {
          "name": "reaction",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  97,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "post"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "reactorProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "post",
                "kind": "account",
                "path": "post.author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          }
        },
        {
          "name": "reactorProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "reactorProfile.owner"
              }
            ]
          }
        },
        {
          "docs": [
            "The reactor — must be the reactor_profile owner"
          ],
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "reactionType",
          "type": "u8"
        }
      ],
      "discriminator": [
        186,
        193,
        53,
        26,
        172,
        69,
        217,
        231
      ],
      "name": "reactToPost"
    },
    {
      "accounts": [
        {
          "name": "message",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  115,
                  115,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "chatId"
              },
              {
                "kind": "arg",
                "path": "messageIndex"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "chat",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "chatId"
              }
            ]
          },
          "writable": true
        },
        {
          "docs": [
            "Message sender — must be a participant in the chat"
          ],
          "name": "sender",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Fee payer — treasury for gasless UX"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "chatId",
          "type": "u64"
        },
        {
          "name": "messageIndex",
          "type": "u64"
        },
        {
          "name": "content",
          "type": "string"
        }
      ],
      "discriminator": [
        57,
        40,
        34,
        178,
        189,
        10,
        65,
        26
      ],
      "name": "sendMessage"
    },
    {
      "accounts": [
        {
          "name": "followAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  108,
                  108,
                  111,
                  119
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followerProfile.owner"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followingProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "followerProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "followingProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followingProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [],
      "discriminator": [
        204,
        183,
        196,
        110,
        97,
        165,
        226,
        213
      ],
      "name": "unfollowUser"
    },
    {
      "accounts": [
        {
          "name": "community",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "communityId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        }
      ],
      "args": [
        {
          "name": "communityId",
          "type": "u64"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "avatarUrl",
          "type": "string"
        }
      ],
      "discriminator": [
        250,
        158,
        38,
        207,
        116,
        171,
        210,
        51
      ],
      "name": "updateCommunity"
    },
    {
      "accounts": [
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Fee payer — treasury pays for realloc rent in gasless UX"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "displayName",
          "type": "string"
        },
        {
          "name": "bio",
          "type": "string"
        },
        {
          "name": "avatarUrl",
          "type": "string"
        },
        {
          "name": "bannerUrl",
          "type": "string"
        }
      ],
      "discriminator": [
        98,
        67,
        99,
        206,
        86,
        115,
        175,
        1
      ],
      "name": "updateProfile"
    },
    {
      "accounts": [
        {
          "name": "poll",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  108
                ]
              },
              {
                "account": "poll",
                "kind": "account",
                "path": "poll.creator"
              },
              {
                "kind": "arg",
                "path": "pollId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "pollVote",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  108,
                  95,
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "poll"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "voterProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "voterProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "pollId",
          "type": "u64"
        },
        {
          "name": "choice",
          "type": "u8"
        }
      ],
      "discriminator": [
        154,
        219,
        48,
        148,
        149,
        7,
        153,
        194
      ],
      "name": "votePoll"
    }
  ],
  "metadata": {
    "description": "ShadowSpace - Social on Solana",
    "name": "shadowspace",
    "spec": "0.1.0",
    "version": "0.1.0"
  },
  "types": [
    {
      "name": "chat",
      "type": {
        "fields": [
          {
            "name": "chatId",
            "type": "u64"
          },
          {
            "name": "user1",
            "type": "pubkey"
          },
          {
            "name": "user2",
            "type": "pubkey"
          },
          {
            "name": "messageCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "comment",
      "type": {
        "fields": [
          {
            "name": "post",
            "type": "pubkey"
          },
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "commentIndex",
            "type": "u64"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "community",
      "type": {
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "communityId",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "avatarUrl",
            "type": "string"
          },
          {
            "name": "memberCount",
            "type": "u32"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "followAccount",
      "type": {
        "fields": [
          {
            "name": "follower",
            "type": "pubkey"
          },
          {
            "name": "following",
            "type": "pubkey"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "likeRecord",
      "type": {
        "fields": [
          {
            "name": "post",
            "type": "pubkey"
          },
          {
            "name": "liker",
            "type": "pubkey"
          },
          {
            "name": "likedAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "membership",
      "type": {
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "joinedAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "message",
      "type": {
        "fields": [
          {
            "name": "chatId",
            "type": "u64"
          },
          {
            "name": "messageIndex",
            "type": "u64"
          },
          {
            "name": "sender",
            "type": "pubkey"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "poll",
      "type": {
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "pollId",
            "type": "u64"
          },
          {
            "name": "question",
            "type": "string"
          },
          {
            "name": "optionA",
            "type": "string"
          },
          {
            "name": "optionB",
            "type": "string"
          },
          {
            "name": "optionC",
            "type": "string"
          },
          {
            "name": "optionD",
            "type": "string"
          },
          {
            "name": "numOptions",
            "type": "u8"
          },
          {
            "name": "votesA",
            "type": "u32"
          },
          {
            "name": "votesB",
            "type": "u32"
          },
          {
            "name": "votesC",
            "type": "u32"
          },
          {
            "name": "votesD",
            "type": "u32"
          },
          {
            "name": "totalVotes",
            "type": "u32"
          },
          {
            "name": "endsAt",
            "type": "i64"
          },
          {
            "name": "isClosed",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "pollVote",
      "type": {
        "fields": [
          {
            "name": "poll",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "choice",
            "type": "u8"
          },
          {
            "name": "votedAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "post",
      "type": {
        "fields": [
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "postId",
            "type": "u64"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "isPrivate",
            "type": "bool"
          },
          {
            "name": "likes",
            "type": "u32"
          },
          {
            "name": "commentCount",
            "type": "u32"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "profile",
      "type": {
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "username",
            "type": "string"
          },
          {
            "name": "displayName",
            "type": "string"
          },
          {
            "name": "bio",
            "type": "string"
          },
          {
            "name": "isPrivate",
            "type": "bool"
          },
          {
            "name": "postCount",
            "type": "u32"
          },
          {
            "name": "followerCount",
            "type": "u32"
          },
          {
            "name": "followingCount",
            "type": "u32"
          },
          {
            "name": "activeConversationCount",
            "type": "u16"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "avatarUrl",
            "type": "string"
          },
          {
            "name": "bannerUrl",
            "type": "string"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "reaction",
      "type": {
        "fields": [
          {
            "name": "post",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "reactionType",
            "type": "u8"
          }
        ],
        "kind": "struct"
      }
    }
  ]
};

export const IDL: Shadowspace = {
  "accounts": [
    {
      "discriminator": [
        170,
        4,
        71,
        128,
        185,
        103,
        250,
        177
      ],
      "name": "chat"
    },
    {
      "discriminator": [
        150,
        135,
        96,
        244,
        55,
        199,
        50,
        65
      ],
      "name": "comment"
    },
    {
      "discriminator": [
        192,
        73,
        211,
        158,
        178,
        81,
        19,
        112
      ],
      "name": "community"
    },
    {
      "discriminator": [
        174,
        177,
        136,
        60,
        138,
        84,
        148,
        209
      ],
      "name": "followAccount"
    },
    {
      "discriminator": [
        179,
        237,
        53,
        5,
        91,
        236,
        161,
        50
      ],
      "name": "likeRecord"
    },
    {
      "discriminator": [
        231,
        141,
        180,
        98,
        109,
        168,
        175,
        166
      ],
      "name": "membership"
    },
    {
      "discriminator": [
        110,
        151,
        23,
        110,
        198,
        6,
        125,
        181
      ],
      "name": "message"
    },
    {
      "discriminator": [
        110,
        234,
        167,
        188,
        231,
        136,
        153,
        111
      ],
      "name": "poll"
    },
    {
      "discriminator": [
        60,
        154,
        212,
        155,
        112,
        25,
        150,
        182
      ],
      "name": "pollVote"
    },
    {
      "discriminator": [
        8,
        147,
        90,
        186,
        185,
        56,
        192,
        150
      ],
      "name": "post"
    },
    {
      "discriminator": [
        184,
        101,
        165,
        188,
        95,
        63,
        127,
        188
      ],
      "name": "profile"
    },
    {
      "discriminator": [
        226,
        61,
        100,
        191,
        223,
        221,
        142,
        139
      ],
      "name": "reaction"
    }
  ],
  "address": "CKdp6xnNnsMk5NsyQU9YEVU88wHfDdLUep3eJz4VVMFh",
  "errors": [
    {
      "code": 6000,
      "msg": "Already following this user",
      "name": "alreadyFollowing"
    },
    {
      "code": 6001,
      "msg": "Not following this user",
      "name": "notFollowing"
    },
    {
      "code": 6002,
      "msg": "Unauthorized",
      "name": "unauthorized"
    },
    {
      "code": 6003,
      "msg": "Content too long",
      "name": "contentTooLong"
    },
    {
      "code": 6004,
      "msg": "Cannot follow yourself",
      "name": "cannotFollowSelf"
    },
    {
      "code": 6005,
      "msg": "Invalid amount",
      "name": "invalidAmount"
    },
    {
      "code": 6006,
      "msg": "Community is full (max 100 members)",
      "name": "communityFull"
    },
    {
      "code": 6007,
      "msg": "Account already initialized",
      "name": "alreadyInitialized"
    },
    {
      "code": 6008,
      "msg": "Poll must have 2-4 options",
      "name": "invalidPollOptions"
    },
    {
      "code": 6009,
      "msg": "Invalid poll choice",
      "name": "invalidPollChoice"
    },
    {
      "code": 6010,
      "msg": "Poll has ended",
      "name": "pollAlreadyEnded"
    },
    {
      "code": 6011,
      "msg": "Already liked this post",
      "name": "alreadyLiked"
    },
    {
      "code": 6012,
      "msg": "Cannot like your own post",
      "name": "cannotLikeOwnPost"
    },
    {
      "code": 6013,
      "msg": "Invalid reaction type",
      "name": "invalidReactionType"
    }
  ],
  "instructions": [
    {
      "accounts": [
        {
          "name": "chat",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "chatId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "chatId",
          "type": "u64"
        }
      ],
      "discriminator": [
        182,
        227,
        125,
        158,
        213,
        132,
        147,
        192
      ],
      "docs": [
        "Close a legacy chat account and return rent"
      ],
      "name": "closeChat"
    },
    {
      "accounts": [
        {
          "name": "comment",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "post"
              },
              {
                "kind": "arg",
                "path": "commentIndex"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "post",
                "kind": "account",
                "path": "post.author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "commentIndex",
          "type": "u64"
        }
      ],
      "discriminator": [
        220,
        161,
        167,
        122,
        254,
        149,
        11,
        78
      ],
      "docs": [
        "Close a comment account and return rent"
      ],
      "name": "closeComment"
    },
    {
      "accounts": [
        {
          "name": "community",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "communityId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "communityId",
          "type": "u64"
        }
      ],
      "discriminator": [
        193,
        80,
        180,
        65,
        226,
        240,
        125,
        104
      ],
      "name": "closeCommunity"
    },
    {
      "accounts": [
        {
          "name": "message",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  115,
                  115,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "chatId"
              },
              {
                "kind": "arg",
                "path": "messageIndex"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "chatId",
          "type": "u64"
        },
        {
          "name": "messageIndex",
          "type": "u64"
        }
      ],
      "discriminator": [
        53,
        48,
        100,
        249,
        207,
        188,
        96,
        22
      ],
      "docs": [
        "Close a legacy message account and return rent"
      ],
      "name": "closeMessage"
    },
    {
      "accounts": [
        {
          "name": "poll",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  108
                ]
              },
              {
                "account": "poll",
                "kind": "account",
                "path": "poll.creator"
              },
              {
                "kind": "arg",
                "path": "pollId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        }
      ],
      "args": [
        {
          "name": "pollId",
          "type": "u64"
        }
      ],
      "discriminator": [
        139,
        213,
        162,
        65,
        172,
        150,
        123,
        67
      ],
      "name": "closePoll"
    },
    {
      "accounts": [
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "user"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        }
      ],
      "discriminator": [
        131,
        190,
        34,
        94,
        190,
        71,
        183,
        81
      ],
      "docs": [
        "Close a post account and return rent to the treasury"
      ],
      "name": "closePost"
    },
    {
      "accounts": [
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [],
      "discriminator": [
        167,
        36,
        181,
        8,
        136,
        158,
        46,
        207
      ],
      "docs": [
        "Close a profile account and return rent to the treasury"
      ],
      "name": "closeProfile"
    },
    {
      "accounts": [
        {
          "name": "reaction",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  97,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "post"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "post",
                "kind": "account",
                "path": "post.author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        }
      ],
      "discriminator": [
        92,
        52,
        140,
        129,
        113,
        132,
        43,
        244
      ],
      "docs": [
        "Close a reaction account and return rent"
      ],
      "name": "closeReaction"
    },
    {
      "accounts": [
        {
          "name": "chat",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "chatId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user1",
          "signer": true,
          "writable": true
        },
        {
          "name": "user2"
        },
        {
          "docs": [
            "Fee payer — treasury for gasless UX"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "chatId",
          "type": "u64"
        }
      ],
      "discriminator": [
        133,
        186,
        254,
        72,
        143,
        178,
        221,
        28
      ],
      "name": "createChat"
    },
    {
      "accounts": [
        {
          "name": "comment",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "post"
              },
              {
                "kind": "arg",
                "path": "commentIndex"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "post",
                "kind": "account",
                "path": "post.author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "commenterProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "commenterProfile.owner"
              }
            ]
          }
        },
        {
          "docs": [
            "The commenter — must be the commenter_profile owner"
          ],
          "name": "author",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "commentIndex",
          "type": "u64"
        },
        {
          "name": "content",
          "type": "string"
        }
      ],
      "discriminator": [
        236,
        232,
        11,
        180,
        70,
        206,
        73,
        145
      ],
      "name": "createComment"
    },
    {
      "accounts": [
        {
          "name": "community",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "communityId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "creatorProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "communityId",
          "type": "u64"
        },
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "avatarUrl",
          "type": "string"
        }
      ],
      "discriminator": [
        203,
        214,
        176,
        194,
        13,
        207,
        22,
        60
      ],
      "name": "createCommunity"
    },
    {
      "accounts": [
        {
          "name": "poll",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  108
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "profile.owner"
              },
              {
                "kind": "arg",
                "path": "pollId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "pollId",
          "type": "u64"
        },
        {
          "name": "question",
          "type": "string"
        },
        {
          "name": "optionA",
          "type": "string"
        },
        {
          "name": "optionB",
          "type": "string"
        },
        {
          "name": "optionC",
          "type": "string"
        },
        {
          "name": "optionD",
          "type": "string"
        },
        {
          "name": "numOptions",
          "type": "u8"
        },
        {
          "name": "endsAt",
          "type": "i64"
        }
      ],
      "discriminator": [
        182,
        171,
        112,
        238,
        6,
        219,
        14,
        110
      ],
      "name": "createPoll"
    },
    {
      "accounts": [
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "profile.owner"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "profile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "docs": [
            "The post author — must be the profile owner"
          ],
          "name": "author",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "content",
          "type": "string"
        },
        {
          "name": "isPrivate",
          "type": "bool"
        }
      ],
      "discriminator": [
        123,
        92,
        184,
        29,
        231,
        24,
        15,
        202
      ],
      "name": "createPost"
    },
    {
      "accounts": [
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Fee payer — can be a server keypair for gasless UX"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "username",
          "type": "string"
        },
        {
          "name": "displayName",
          "type": "string"
        },
        {
          "name": "bio",
          "type": "string"
        }
      ],
      "discriminator": [
        225,
        205,
        234,
        143,
        17,
        186,
        50,
        220
      ],
      "name": "createProfile"
    },
    {
      "accounts": [
        {
          "docs": [
            "The post PDA — seeded by the author's pubkey, so only the real author's post is found"
          ],
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "docs": [
            "Must be the original author — if anyone else signs, the seed/constraint check fails"
          ],
          "name": "author",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "newContent",
          "type": "string"
        }
      ],
      "discriminator": [
        218,
        25,
        82,
        105,
        200,
        189,
        238,
        75
      ],
      "name": "editPost"
    },
    {
      "accounts": [
        {
          "name": "followAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  108,
                  108,
                  111,
                  119
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followerProfile.owner"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followingProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "followerProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "followingProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followingProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Fee payer — can be a server keypair for gasless UX"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [],
      "discriminator": [
        126,
        176,
        97,
        36,
        63,
        145,
        4,
        134
      ],
      "name": "followUser"
    },
    {
      "accounts": [
        {
          "name": "membership",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "community"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "memberProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "community",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "communityId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "memberProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "communityId",
          "type": "u64"
        }
      ],
      "discriminator": [
        252,
        106,
        147,
        30,
        134,
        74,
        28,
        232
      ],
      "name": "joinCommunity"
    },
    {
      "accounts": [
        {
          "name": "membership",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  109,
                  98,
                  101,
                  114,
                  115,
                  104,
                  105,
                  112
                ]
              },
              {
                "kind": "account",
                "path": "community"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "memberProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "community",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "communityId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "memberProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "docs": [
            "Must be the profile owner — prevents others from kicking members"
          ],
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [
        {
          "name": "communityId",
          "type": "u64"
        }
      ],
      "discriminator": [
        218,
        140,
        41,
        66,
        8,
        140,
        33,
        161
      ],
      "name": "leaveCommunity"
    },
    {
      "accounts": [
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "post",
                "kind": "account",
                "path": "post.author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "profile.owner"
              }
            ]
          }
        },
        {
          "docs": [
            "One LikeRecord PDA per (post, liker) — init will fail if they've already liked"
          ],
          "name": "likeRecord",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  105,
                  107,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "post"
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "docs": [
            "The liker — must be the profile owner (read-only, no SOL needed)"
          ],
          "name": "user",
          "signer": true
        },
        {
          "docs": [
            "Treasury pays for like_record rent"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        }
      ],
      "discriminator": [
        45,
        242,
        154,
        71,
        63,
        133,
        54,
        186
      ],
      "name": "likePost"
    },
    {
      "accounts": [
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [],
      "discriminator": [
        224,
        187,
        132,
        189,
        185,
        163,
        183,
        237
      ],
      "docs": [
        "Resize an existing profile account to the current schema size.",
        "This is needed when the Profile struct grows (e.g. adding follower/following counts)."
      ],
      "name": "migrateProfile"
    },
    {
      "accounts": [
        {
          "name": "reaction",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  97,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "post"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "reactorProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "post",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  115,
                  116
                ]
              },
              {
                "account": "post",
                "kind": "account",
                "path": "post.author"
              },
              {
                "kind": "arg",
                "path": "postId"
              }
            ]
          }
        },
        {
          "name": "reactorProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "reactorProfile.owner"
              }
            ]
          }
        },
        {
          "docs": [
            "The reactor — must be the reactor_profile owner"
          ],
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "postId",
          "type": "u64"
        },
        {
          "name": "reactionType",
          "type": "u8"
        }
      ],
      "discriminator": [
        186,
        193,
        53,
        26,
        172,
        69,
        217,
        231
      ],
      "name": "reactToPost"
    },
    {
      "accounts": [
        {
          "name": "message",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  101,
                  115,
                  115,
                  97,
                  103,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "chatId"
              },
              {
                "kind": "arg",
                "path": "messageIndex"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "chat",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  104,
                  97,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "chatId"
              }
            ]
          },
          "writable": true
        },
        {
          "docs": [
            "Message sender — must be a participant in the chat"
          ],
          "name": "sender",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Fee payer — treasury for gasless UX"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "chatId",
          "type": "u64"
        },
        {
          "name": "messageIndex",
          "type": "u64"
        },
        {
          "name": "content",
          "type": "string"
        }
      ],
      "discriminator": [
        57,
        40,
        34,
        178,
        189,
        10,
        65,
        26
      ],
      "name": "sendMessage"
    },
    {
      "accounts": [
        {
          "name": "followAccount",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  108,
                  108,
                  111,
                  119
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followerProfile.owner"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followingProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "followerProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "followingProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "followingProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Treasury wallet — rent refund destination"
          ],
          "name": "treasury",
          "writable": true
        }
      ],
      "args": [],
      "discriminator": [
        204,
        183,
        196,
        110,
        97,
        165,
        226,
        213
      ],
      "name": "unfollowUser"
    },
    {
      "accounts": [
        {
          "name": "community",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  117,
                  110,
                  105,
                  116,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "communityId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        }
      ],
      "args": [
        {
          "name": "communityId",
          "type": "u64"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "avatarUrl",
          "type": "string"
        }
      ],
      "discriminator": [
        250,
        158,
        38,
        207,
        116,
        171,
        210,
        51
      ],
      "name": "updateCommunity"
    },
    {
      "accounts": [
        {
          "name": "profile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "docs": [
            "Fee payer — treasury pays for realloc rent in gasless UX"
          ],
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "displayName",
          "type": "string"
        },
        {
          "name": "bio",
          "type": "string"
        },
        {
          "name": "avatarUrl",
          "type": "string"
        },
        {
          "name": "bannerUrl",
          "type": "string"
        }
      ],
      "discriminator": [
        98,
        67,
        99,
        206,
        86,
        115,
        175,
        1
      ],
      "name": "updateProfile"
    },
    {
      "accounts": [
        {
          "name": "poll",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  108
                ]
              },
              {
                "account": "poll",
                "kind": "account",
                "path": "poll.creator"
              },
              {
                "kind": "arg",
                "path": "pollId"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "pollVote",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  108,
                  108,
                  95,
                  118,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "poll"
              },
              {
                "account": "profile",
                "kind": "account",
                "path": "voterProfile.owner"
              }
            ]
          },
          "writable": true
        },
        {
          "name": "voterProfile",
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "user",
          "signer": true,
          "writable": true
        },
        {
          "name": "payer",
          "signer": true,
          "writable": true
        },
        {
          "address": "11111111111111111111111111111111",
          "name": "systemProgram"
        }
      ],
      "args": [
        {
          "name": "pollId",
          "type": "u64"
        },
        {
          "name": "choice",
          "type": "u8"
        }
      ],
      "discriminator": [
        154,
        219,
        48,
        148,
        149,
        7,
        153,
        194
      ],
      "name": "votePoll"
    }
  ],
  "metadata": {
    "description": "ShadowSpace - Social on Solana",
    "name": "shadowspace",
    "spec": "0.1.0",
    "version": "0.1.0"
  },
  "types": [
    {
      "name": "chat",
      "type": {
        "fields": [
          {
            "name": "chatId",
            "type": "u64"
          },
          {
            "name": "user1",
            "type": "pubkey"
          },
          {
            "name": "user2",
            "type": "pubkey"
          },
          {
            "name": "messageCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "comment",
      "type": {
        "fields": [
          {
            "name": "post",
            "type": "pubkey"
          },
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "commentIndex",
            "type": "u64"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "community",
      "type": {
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "communityId",
            "type": "u64"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "avatarUrl",
            "type": "string"
          },
          {
            "name": "memberCount",
            "type": "u32"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "followAccount",
      "type": {
        "fields": [
          {
            "name": "follower",
            "type": "pubkey"
          },
          {
            "name": "following",
            "type": "pubkey"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "likeRecord",
      "type": {
        "fields": [
          {
            "name": "post",
            "type": "pubkey"
          },
          {
            "name": "liker",
            "type": "pubkey"
          },
          {
            "name": "likedAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "membership",
      "type": {
        "fields": [
          {
            "name": "community",
            "type": "pubkey"
          },
          {
            "name": "member",
            "type": "pubkey"
          },
          {
            "name": "joinedAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "message",
      "type": {
        "fields": [
          {
            "name": "chatId",
            "type": "u64"
          },
          {
            "name": "messageIndex",
            "type": "u64"
          },
          {
            "name": "sender",
            "type": "pubkey"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "poll",
      "type": {
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "pollId",
            "type": "u64"
          },
          {
            "name": "question",
            "type": "string"
          },
          {
            "name": "optionA",
            "type": "string"
          },
          {
            "name": "optionB",
            "type": "string"
          },
          {
            "name": "optionC",
            "type": "string"
          },
          {
            "name": "optionD",
            "type": "string"
          },
          {
            "name": "numOptions",
            "type": "u8"
          },
          {
            "name": "votesA",
            "type": "u32"
          },
          {
            "name": "votesB",
            "type": "u32"
          },
          {
            "name": "votesC",
            "type": "u32"
          },
          {
            "name": "votesD",
            "type": "u32"
          },
          {
            "name": "totalVotes",
            "type": "u32"
          },
          {
            "name": "endsAt",
            "type": "i64"
          },
          {
            "name": "isClosed",
            "type": "bool"
          },
          {
            "name": "createdAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "pollVote",
      "type": {
        "fields": [
          {
            "name": "poll",
            "type": "pubkey"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "choice",
            "type": "u8"
          },
          {
            "name": "votedAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "post",
      "type": {
        "fields": [
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "postId",
            "type": "u64"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "isPrivate",
            "type": "bool"
          },
          {
            "name": "likes",
            "type": "u32"
          },
          {
            "name": "commentCount",
            "type": "u32"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "profile",
      "type": {
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "username",
            "type": "string"
          },
          {
            "name": "displayName",
            "type": "string"
          },
          {
            "name": "bio",
            "type": "string"
          },
          {
            "name": "isPrivate",
            "type": "bool"
          },
          {
            "name": "postCount",
            "type": "u32"
          },
          {
            "name": "followerCount",
            "type": "u32"
          },
          {
            "name": "followingCount",
            "type": "u32"
          },
          {
            "name": "activeConversationCount",
            "type": "u16"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "avatarUrl",
            "type": "string"
          },
          {
            "name": "bannerUrl",
            "type": "string"
          }
        ],
        "kind": "struct"
      }
    },
    {
      "name": "reaction",
      "type": {
        "fields": [
          {
            "name": "post",
            "type": "pubkey"
          },
          {
            "name": "user",
            "type": "pubkey"
          },
          {
            "name": "reactionType",
            "type": "u8"
          }
        ],
        "kind": "struct"
      }
    }
  ]
};

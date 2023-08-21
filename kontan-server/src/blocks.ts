/* eslint-disable max-len */
import { ModalView, View, PlainTextOption, Block } from '@slack/web-api';
import {
  InboundDto,
  Status,
  UpcomingPresenceDto,
  Office,
  StatusMessage,
} from './services/OfficeService';
import {
  getDay,
  getUpcomingWeekdayKeys,
  getWeek,
  weekdayKeyToDayStr,
  weekdayKeyBuilder,
} from './utils';
import { User } from './services/UserService';

export const ACTIONS = {
  REGISTER_BUTTON: 'register_button',
  // When a user clicks Submit in a modal
  SUBMIT: 'view_submission',
  DAY_CHECKBOX: 'day_button',
  REFRESH_BUTTON: 'refresh_button',
  OFFICE_SELECT: 'office_select',
  CHECKIN_BUTTON: 'checkin_button',
  SETTINGS_BUTTON: 'settings_button',
  STATUS_MESSAGE_BUTTON: 'status_message_button',
  STATUS_MESSAGE_DAY: 'status_message_day',
  STATUS_MESSAGE_MESSAGE: 'status_message_message',
};

export const BLOCK_IDS = {
  NFC_SERIAL: 'nfc_serial',
  HOME_OFFICE: 'home_office',
  COMPACT_MODE: 'compact_mode',
  STATUS_MESSAGE_DAY: 'status_message_day',
  STATUS_MESSAGE_MESSAGE: 'status_message_message',
};

export const MODALS = {
  REGISTER: 'register',
  SETTINGS: 'settings',
  STATUS_MESSAGE: 'status_message',
};

export const newUserBlock: View = {
  type: 'home',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Hello! :tada: It seems this is the first time you are using *@Kontan*. To use this app, you must first register. If you have an NFC tag you want to use for checking in at the Helsingborg office, you need the serial number of that tag. This can be retrieved with the NFC Tools app. Should look something like this: `e9:c0:0s:33`',
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Register',
            emoji: true,
          },
          value: ACTIONS.REGISTER_BUTTON,
          action_id: ACTIONS.REGISTER_BUTTON,
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'NFC Tools App',
            emoji: true,
          },
          value: 'click_me_123',
          url: 'https://play.google.com/store/apps/details?id=com.wakdev.wdnfc&hl=en&gl=US',
        },
      ],
    },
  ],
};

export const registerModal = (offices: Office[]): ModalView => {
  const officeNames = offices.map((office) => {
    return {
      text: {
        type: 'plain_text',
        text: `${office.id}`,
      },
      value: `${office.id}`,
    } as PlainTextOption;
  });

  return {
    type: 'modal',
    callback_id: MODALS.REGISTER,
    title: {
      type: 'plain_text',
      text: 'Register to Kontan',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Submit :tada:',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
      emoji: true,
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: "OK so you're ready to sign up?",
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'By using this app, when applicable and when you choose to share that information, others will see your office presence.',
          emoji: true,
        },
      },
      {
        type: 'input',
        element: {
          type: 'static_select',
          action_id: BLOCK_IDS.HOME_OFFICE + '-action',
          placeholder: {
            type: 'plain_text',
            text: 'Office',
          },
          options: officeNames,
        },
        block_id: BLOCK_IDS.HOME_OFFICE,
        label: {
          type: 'plain_text',
          text: 'Select a home office',
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'NFC Tag is only used in Helsingborg for now',
        },
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'The only thing I need is your NFC Tag serial number and then we can start interacting',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'You could choose any NFC tag, but it will be convenient if you choose the same as the one you unlock the door with',
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'input',
        element: {
          type: 'plain_text_input',
          action_id: BLOCK_IDS.NFC_SERIAL + '-action',
        },
        block_id: BLOCK_IDS.NFC_SERIAL,
        label: {
          type: 'plain_text',
          text: 'NFC Tag serial, e.g. t5:s0:1b:2f',
          emoji: true,
        },
        optional: true,
      },
    ],
  };
};

export const statusMessageModal = (
  userId: User['slackUserId'],
  plannedPresence: UpcomingPresenceDto[],
): ModalView => {
  return {
    type: 'modal',
    callback_id: MODALS.STATUS_MESSAGE,
    title: {
      type: 'plain_text',
      text: 'Add a status message',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Add',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
      emoji: true,
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: "Here you can add a status message to be displayed next to your name on specific days. Choose one of the days that you're already planned for",
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
      ...(!plannedPresence.length
        ? [
            {
              type: 'section',
              text: {
                type: 'plain_text',
                text: "It doesn't seem like you have any days planned in the near future :shrug: Please plan your days before adding status messages.",
                emoji: true,
              },
            } as Block,
          ]
        : []),
      ...(!!plannedPresence.length
        ? [
            {
              type: 'input',
              label: {
                type: 'plain_text',
                text: 'You are planned for these days, choose one',
              },
              block_id: BLOCK_IDS.STATUS_MESSAGE_DAY,
              element: {
                type: 'radio_buttons',
                action_id: ACTIONS.STATUS_MESSAGE_DAY + '-action',
                options: plannedPresence.reduce(
                  (acc, curr) => [
                    ...acc,
                    {
                      text: {
                        type: 'plain_text',
                        text: weekdayKeyToDayStr(curr.key),
                      },
                      value: curr.key,
                    },
                  ],
                  [],
                ),
              },
            } as Block,
            {
              type: 'input',
              element: {
                type: 'plain_text_input',
                action_id: BLOCK_IDS.STATUS_MESSAGE_MESSAGE + '-action',
              },
              block_id: BLOCK_IDS.STATUS_MESSAGE_MESSAGE,
              label: {
                type: 'plain_text',
                text: 'Your custom status for the day, emojis are supported',
                emoji: true,
              },
            } as Block,
            {
              type: 'divider',
            },
            {
              type: 'section',
              text: {
                type: 'plain_text',
                text: ':pro-tip: If you want to edit a status message, select the date of that status and add a new one.',
                emoji: true,
              },
            } as Block,
          ]
        : []),
    ],
  };
};

export const settingsModal = (user: User): ModalView => {
  return {
    type: 'modal',
    callback_id: MODALS.SETTINGS,
    title: {
      type: 'plain_text',
      text: 'Settings',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Update',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
      emoji: true,
    },
    blocks: [
      {
        type: 'input',
        element: {
          type: 'plain_text_input',
          action_id: BLOCK_IDS.NFC_SERIAL + '-action',
          initial_value: user.tag,
        },
        block_id: BLOCK_IDS.NFC_SERIAL,
        label: {
          type: 'plain_text',
          text: 'NFC Tag serial, e.g. t5:s0:1b:2f',
          emoji: true,
        },
        optional: true,
      },
      {
        type: 'input',
        block_id: BLOCK_IDS.COMPACT_MODE,
        label: {
          type: 'plain_text',
          text: 'Layout',
        },
        element: {
          type: 'checkboxes',
          action_id: BLOCK_IDS.COMPACT_MODE + '-action',
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Compact',
              },
              value: 'true',
            },
          ],
          ...(user.compactMode && {
            initial_options: [
              {
                text: {
                  type: 'plain_text',
                  text: 'Compact',
                },
                value: 'true',
              },
            ],
          }),
        },
        optional: true,
      },
    ],
  };
};

export const homeScreen = ({
  presentUsers,
  plannedPresence,
  user,
  offices,
  statusMessages,
}: {
  presentUsers: InboundDto[];
  plannedPresence: UpcomingPresenceDto[];
  user: User;
  offices: Office[];
  statusMessages: StatusMessage[];
}): View => {
  const initialOptions = new Array<PlainTextOption>();
  const inputOptions = new Array<PlainTextOption>();
  const keys = getUpcomingWeekdayKeys();
  const today = weekdayKeyBuilder(Date.now());
  const officeNames = offices.map((office) => {
    return {
      text: {
        type: 'plain_text',
        text: `${office.id}`,
      },
      value: `${office.id}`,
    } as PlainTextOption;
  });

  const getStatusMessage = (userId: string, weekday: string) => {
    const message = statusMessages.find(
      (s) => s.slackUserId === userId && s.dayKey === weekday,
    )?.text;
    return message ? ` - ${message}` : '';
  };

  const getUserStatus = (
    status: Status,
    userId: string,
    weekday: string,
  ): string => {
    switch (status) {
      case 'INBOUND':
        return ':white_check_mark:' + getStatusMessage(userId, weekday);
      case 'OUTBOUND':
        return '_Checked out_ :house_with_garden:';
      default:
        return '_Not checked in yet_' + getStatusMessage(userId, weekday);
    }
  };

  const initialOfficeOption = officeNames.find(
    (office) => office.value === user.office,
  );

  const currentUser = presentUsers.find(
    (usr) => usr.slackUserId === user.slackUserId,
  );

  keys.forEach((key) => {
    const inputOption = {
      text: {
        type: 'plain_text',
        text: key === today ? `Today` : `${weekdayKeyToDayStr(key, false)}`,
        emoji: true,
      },
      value: `weekdayCheckbox-${key}`,
      ...(getDay(key) === 1 && {
        description: {
          type: 'mrkdwn',
          text: `_Week ${getWeek(key)}_`,
        },
      }),
    } as unknown as PlainTextOption;
    inputOptions.push(inputOption);
    if (
      plannedPresence.find(
        (presence) =>
          presence.users.some((usr) => usr.slackUserId === user.slackUserId) &&
          key === presence.key,
      )
    ) {
      initialOptions.push(inputOption);
    }
  });

  const checkInBlock = [
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: currentUser?.status === 'INBOUND' ? 'Check-out' : 'Check-in',
            emoji: true,
          },
          value: ACTIONS.CHECKIN_BUTTON,
          action_id: ACTIONS.CHECKIN_BUTTON,
        },
      ],
    },
  ];

  const todayBlocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: ':office: Today',
      },
    },
    ...(user.compactMode
      ? [
          ...(presentUsers.length > 0
            ? [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: presentUsers
                      .map(
                        (usr) =>
                          `${usr.name} - ${getUserStatus(
                            usr.status,
                            usr.slackUserId,
                            today,
                          )}`,
                      )
                      .join(', '),
                  },
                },
              ]
            : []),
        ]
      : presentUsers.map((usr) => {
          return {
            type: 'section',
            text: {
              type: 'plain_text',
              emoji: true,
              text: `${usr.name} - ${getUserStatus(
                usr.status,
                usr.slackUserId,
                today,
              )}`,
            },
          };
        })),
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Refresh',
            emoji: true,
          },
          value: ACTIONS.REFRESH_BUTTON,
          action_id: ACTIONS.REFRESH_BUTTON,
        },
      ],
    },
    {
      type: 'divider',
    },
  ];

  return {
    type: 'home',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Welcome to Kontan! :tada:',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'This is your space to manage and see office presence, to make it easier for you to plan your work week!',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: ':gear: Settings',
              emoji: true,
            },
            value: ACTIONS.SETTINGS_BUTTON,
            action_id: ACTIONS.SETTINGS_BUTTON,
          },
        ],
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'Select an office',
        },
        accessory: {
          action_id: ACTIONS.OFFICE_SELECT,
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Office',
          },
          options: officeNames,
          ...(initialOfficeOption && {
            initial_option: initialOfficeOption,
          }),
        },
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'My Work Days',
          emoji: true,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: ':speech_balloon: Add a status message',
              emoji: true,
            },
            value: ACTIONS.STATUS_MESSAGE_BUTTON,
            action_id: ACTIONS.STATUS_MESSAGE_BUTTON,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'I plan to be in the office on',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'checkboxes',
            ...(initialOptions.length !== 0 && {
              initial_options: initialOptions,
            }),
            options: inputOptions,
            action_id: ACTIONS.DAY_CHECKBOX,
          },
        ],
      },
      {
        type: 'divider',
      },
      ...(currentUser ? checkInBlock : []),
      ...todayBlocks,
      ...plannedPresence
        .filter((item) => item.key !== today)
        .map(({ weekday, users, key }) => {
          const noOne = {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '_Expect the sound of silence_',
            },
          };
          return [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: weekday,
              },
            },
            ...(user.compactMode
              ? [
                  ...(users.length > 0
                    ? [
                        {
                          type: 'section',
                          text: {
                            type: 'plain_text',
                            emoji: true,
                            text: users
                              .map(
                                (usr) =>
                                  `${usr.name}${getStatusMessage(
                                    usr.slackUserId,
                                    key,
                                  )}`,
                              )
                              .join(', '),
                          },
                        },
                      ]
                    : []),
                ]
              : users.map((usr) => {
                  return {
                    type: 'section',
                    text: {
                      type: 'plain_text',
                      emoji: true,
                      text: `${usr.name}${getStatusMessage(
                        usr.slackUserId,
                        key,
                      )}`,
                    },
                  };
                })),
            ...(users.length === 0 ? [noOne] : []),
            {
              type: 'divider',
            },
          ];
        })
        .flat(),
      ...(plannedPresence.length === 0
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '_No planned presence_',
              },
            },
          ]
        : []),
    ],
  };
};

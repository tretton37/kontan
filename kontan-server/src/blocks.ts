/* eslint-disable max-len */
import {
  ModalView,
  View,
  PlainTextOption,
  Block,
  Option,
} from '@slack/web-api';
import {
  InboundDto,
  Status,
  UpcomingPresenceDto,
  Office,
  StatusMessage,
  ParkingSpacePresence,
  ParkingSpacePresenceDto,
  ParkingSpaceTimeSlot,
  parkingSpaceTimeSlotToText,
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
  STATUS_MESSAGE_TODAY: 'status_message_today',
  STATUS_MESSAGE_TODAY_MESSAGE: 'status_message_today_message',
  MISC: 'misc',
  PARKING_MODAL: 'parking_modal',
  PARKING_CHECKBOX: 'parking_checkbox',
};

export const BLOCK_IDS = {
  NFC_SERIAL: 'nfc_serial',
  HOME_OFFICE: 'home_office',
  COMPACT_MODE: 'compact_mode',
  STATUS_MESSAGE_DAY: 'status_message_day',
  STATUS_MESSAGE_MESSAGE: 'status_message_message',
  STATUS_MESSAGE_TODAY: 'status_message_today',
  STATUS_MESSAGE_TODAY_MESSAGE: 'status_message_today_message',
  MISC: 'misc',
};

export const MODALS = {
  REGISTER: 'register',
  SETTINGS: 'settings',
  STATUS_MESSAGE: 'status_message',
  STATUS_MESSAGE_TODAY: 'status_message_today',
  PARKING_MODAL: 'parking_modal',
};

export const MISC_OPTIONS_VALUES = {
  block_status_message_prompt: 'block_status_message_prompt',
  compact: 'compact',
  presence_notifications: 'presence_notifications',
};

export const MISC_OPTIONS_TO_KEYS = {
  block_status_message_prompt: 'blockStatusMessagePrompt',
  compact: 'compactMode',
  presence_notifications: 'presenceNotifications',
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

export const statusMessageTodayModal = (): ModalView => {
  return {
    type: 'modal',
    notify_on_close: true,
    callback_id: MODALS.STATUS_MESSAGE_TODAY,
    title: {
      type: 'plain_text',
      text: 'Add a status message?',
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Add',
      emoji: true,
    },
    close: {
      type: 'plain_text',
      text: "Nope I'm good",
      emoji: true,
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: 'Would you like to add a status message for today? Maybe you want a lunch buddy or someone to grab a fika with. You can also add one later.',
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
          action_id: BLOCK_IDS.STATUS_MESSAGE_TODAY_MESSAGE + '-action',
        },
        block_id: BLOCK_IDS.STATUS_MESSAGE_TODAY_MESSAGE,
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
          text: ':pro-tip: If you find this annoying you can turn it off in settings.',
          emoji: true,
        },
      } as Block,
    ],
  };
};

export const settingsModal = (user: User): ModalView => {
  const getInitialOptions = () => {
    const options = [];

    if (user.compactMode) {
      options.push({
        text: {
          type: 'plain_text',
          text: 'Compact layout',
        },
        value: MISC_OPTIONS_VALUES.compact,
      });
    }

    if (user.blockStatusMessagePrompt) {
      options.push({
        text: {
          type: 'plain_text',
          text: 'Block status message prompt on check-in',
        },
        value: MISC_OPTIONS_VALUES.block_status_message_prompt,
      });
    }

    if (user.presenceNotifications) {
      options.push({
        text: {
          type: 'plain_text',
          text: 'Presence notifications',
        },
        value: MISC_OPTIONS_VALUES.presence_notifications,
        description: {
          type: 'plain_text',
          text: 'Get notified when someone books/unbooks the same day as you',
        },
      });
    }

    return !!options.length ? { initial_options: options } : {};
  };
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
        block_id: BLOCK_IDS.MISC,
        label: {
          type: 'plain_text',
          text: 'Misc',
        },
        element: {
          type: 'checkboxes',
          action_id: BLOCK_IDS.MISC + '-action',
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Compact layout',
              },
              value: MISC_OPTIONS_VALUES.compact,
            },
            {
              text: {
                type: 'plain_text',
                text: 'Block status message prompt on check-in',
              },
              value: MISC_OPTIONS_VALUES.block_status_message_prompt,
            },
            {
              text: {
                type: 'plain_text',
                text: 'Presence notifications',
              },
              value: MISC_OPTIONS_VALUES.presence_notifications,
              description: {
                type: 'plain_text',
                text: 'Get notified when someone books/unbooks the same day as you',
              },
            },
          ],
          ...getInitialOptions(),
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
        return 'Checked out :house_with_garden:';
      default:
        return 'Not checked in yet' + getStatusMessage(userId, weekday);
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
      ...(user.office.startsWith('Lund')
        ? [
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: 'Need parking? :car: :parking:',
                    emoji: true,
                  },
                  value: ACTIONS.PARKING_MODAL,
                  action_id: ACTIONS.PARKING_MODAL,
                },
              ],
            },
          ]
        : []),
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

export const parkingModal = ({
  plannedParking,
  user,
}: {
  plannedParking: ParkingSpacePresenceDto[][];
  user: User;
}): View => {
  const keys = getUpcomingWeekdayKeys();
  const initialOptions = {} as Record<string, Option[]>;
  const inputOptions = {} as Record<string, Option[]>;
  const today = weekdayKeyBuilder(Date.now());

  const daysToRenderCheckboxes = keys.reduce((acc, curr) => {
    const exists = plannedParking.find((pArr) =>
      pArr?.some((p) => p.dayKey === curr),
    );
    const shouldKeep = plannedParking.some((pArr) =>
      exists
        ? pArr.some(
            (p) =>
              p?.dayKey === curr && p?.user?.slackUserId === user.slackUserId,
          )
        : true,
    );
    return [...acc, shouldKeep && curr].filter(Boolean);
  }, []);

  daysToRenderCheckboxes.forEach((key) => {
    const inputs = [1, 2, 3]
      .reduce((acc, curr) => {
        let match: ParkingSpacePresenceDto;
        plannedParking.forEach((pArr) => {
          const parking = pArr.find(
            (p) => p.dayKey === key && p.timeSlot === curr,
          );
          if (parking) match = parking;
        });
        const identical =
          match?.dayKey === key &&
          match?.timeSlot === curr &&
          match?.user.slackUserId === user.slackUserId;
        const shouldKeep = match ? identical : true;
        const inputOption = {
          text: {
            type: 'plain_text',
            text: parkingSpaceTimeSlotToText(curr as ParkingSpaceTimeSlot),
            emoji: true,
          },
          value: `weekdayCheckbox-${key}*SEPARATOR*${curr}`,
        } as unknown as PlainTextOption;
        if (identical) {
          initialOptions[key] = [...(initialOptions[key] ?? []), inputOption];
        }
        return [...acc, shouldKeep && inputOption];
      }, [])
      .filter(Boolean);
    inputOptions[key] = inputs;
  });

  const renderCheckboxGroup = (key: string) => {
    if (inputOptions[key].length === 0) return [];
    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: key === today ? 'Today' : weekdayKeyToDayStr(key),
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'checkboxes',
            ...(initialOptions[key]?.length > 0 && {
              initial_options: initialOptions[key],
            }),
            options: inputOptions[key],
            action_id: ACTIONS.PARKING_CHECKBOX,
          },
        ],
      },
    ];
  };
  const bookedDaysList = [];
  keys.forEach((key) => {
    const matches = plannedParking.map((pArr) => {
      return pArr.filter((p) => p.dayKey === key);
    });

    matches.forEach((dto) => {
      if (dto.length === 0) return;
      dto
        .sort((a, b) => a.timeSlot - b.timeSlot)
        .forEach((match, i) => {
          if (i === 0) {
            bookedDaysList.push({
              type: 'header',
              text: {
                type: 'plain_text',
                text: weekdayKeyToDayStr(key),
              },
            });
          }
          bookedDaysList.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text:
                parkingSpaceTimeSlotToText(match.timeSlot) +
                ` - ${match?.user?.name}`,
            },
          });
        });
    });
  });

  return {
    type: 'modal',
    callback_id: MODALS.PARKING_MODAL,
    title: {
      type: 'plain_text',
      text: 'Parking ' + user.office,
      emoji: true,
    },
    submit: {
      type: 'plain_text',
      text: 'Done',
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
          type: 'mrkdwn',
          text:
            'This is first and foremost a parking space for visitors and clients. When not used for visitors we can utilize the space internally and book here.\n' +
            'Using the visitors parking space should be an option for occasional use and not an every day choice. If you are booked and we need the space for an external visitor, you will be asked to move your car.\n\n' +
            'Note that you may book several time slots per day, but only one day at a time.\n\n' +
            'Thanks for your cooperation!',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Available time slots',
        },
      },
      ...daysToRenderCheckboxes.map((day) => renderCheckboxGroup(day)).flat(),
      {
        type: 'divider',
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Already Booked time slots',
        },
      },
      {
        type: 'divider',
      },
      ...(bookedDaysList.length > 0
        ? bookedDaysList
        : [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'All time slots are free!',
              },
            },
          ]),
      {
        type: 'divider',
      },
    ] as Block[],
  };
};

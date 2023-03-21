/* eslint-disable max-len */
import { ModalView, View, Option } from '@slack/web-api';
import {
  InboundDto,
  Status,
  UpcomingPresenceDto,
} from './services/OfficeService';
import {
  getDay,
  getUpcomingWeekdayKeys,
  getWeek,
  weekdayKeyToDayStr,
} from './utils';

export const ACTIONS = {
  REGISTER_BUTTON: 'register_button',
  // When a user clicks Submit in the register modal
  SUBMIT: 'view_submission',
  DAY_CHECKBOX: 'day_button',
  REFRESH_BUTTON: 'refresh_button',
};

export const BLOCK_IDS = {
  NFC_SERIAL: 'nfc_serial',
};

export const newUserBlock: View = {
  type: 'home',
  blocks: [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Hello! :tada: It seems this is the first time you are using *@Kontan*. To use this app, you must first register. You need the serial number of the NFC tag you use at the Hbg office, this can be retrieved whith NFC Tools app. Should look something like this: `e9:c0:0s:33`',
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

export const registerModal: ModalView = {
  type: 'modal',
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
      type: 'divider',
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
    },
  ],
};

const getUserStatus = (status: Status): string => {
  switch (status) {
    case 'INBOUND':
      return ':white_check_mark:';
    case 'OUTBOUND':
      return '_Checked out_ :house_with_garden:';
    default:
      return '_Not checked in yet_';
  }
};

export const homeScreen = ({
  presentUsers,
  plannedPresence,
  userId,
}: {
  presentUsers: InboundDto[];
  plannedPresence: UpcomingPresenceDto[];
  userId: string;
}): View => {
  const initialOptions = new Array<Option>();
  const inputOptions = new Array<Option>();
  const keys = getUpcomingWeekdayKeys();
  keys.forEach((key) => {
    const inputOption = {
      text: {
        type: 'plain_text',
        text: `${weekdayKeyToDayStr(key, false)}`,
        emoji: true,
      },
      value: `weekdayCheckbox-${key}`,
      ...(getDay(key) === 1 && {
        description: {
          type: 'mrkdwn',
          text: `_Week ${getWeek(key)}_`,
        },
      }),
    } as unknown as Option;
    inputOptions.push(inputOption);
    if (
      plannedPresence.find(
        (presence) =>
          presence.users.some((user) => user.slackUserId === userId) &&
          key === presence.key,
      )
    ) {
      initialOptions.push(inputOption);
    }
  });

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
        type: 'divider',
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
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ':office: Today',
        },
      },
      ...presentUsers.map((user) => {
        return {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${user.name} - ${getUserStatus(user.status)}`,
          },
        };
      }),
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
      ...plannedPresence
        .map(({ weekday, users }) => {
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
            ...users.map((user) => {
              return {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `_${user.name}_`,
                },
              };
            }),
            ...(users.length === 0 ? [noOne] : []),
            {
              type: 'divider',
            },
          ];
        })
        .flat(),
    ],
  };
};

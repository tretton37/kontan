import { Injectable } from '@nestjs/common';
import { Admin } from './Admin';
import {
  getUpcomingWeekdayKeys,
  weekdayKeyBuilder,
  weekdayKeyToDayStr,
} from '../utils';
import { User } from './UserService';

export type Status = 'INBOUND' | 'OUTBOUND' | 'PLANNED';
export interface InboundDto extends User {
  status: Status;
}

type OfficePresence = { office: Record<User['tag'], { status: Status }> };

export interface UpcomingPresenceDto {
  key: string;
  weekday: string;
  users: User[];
}

type Weekday = Record<string, User['slackUserId'][]>;

@Injectable()
export class OfficeService {
  constructor(private readonly admin: Admin) {}
  async incrementDays(): Promise<void> {
    const ref = this.admin.db().collection('presence').doc('weekday');
    const yesterday = weekdayKeyBuilder(Date.now() - 24 * 60 * 60 * 1000);
    const dayKeys = getUpcomingWeekdayKeys(false);
    const data = (await ref.get()).data() as Weekday;
    delete data?.[yesterday];
    data[dayKeys[dayKeys.length - 1]] = [];
    await ref.set({ ...data });
  }

  async resetInbound(): Promise<void> {
    const ref = this.admin.db().collection('presence').doc('state');
    await ref.set({ office: {} });
  }

  async whoIsInbound(): Promise<InboundDto[]> {
    const ref = this.admin.db().collection('presence').doc('state');
    const snapshot = await ref.get();

    const presence = snapshot.data() as OfficePresence;
    const office = Object.keys(presence.office);
    const usersRef = this.admin.db().collection('users');
    let physicallyCheckedIn: User[] = [];

    if (office?.length > 0) {
      physicallyCheckedIn =
        (
          await usersRef.get().then((users) => {
            return users.docs.map((doc) => doc.data() as User);
          })
        )?.filter((user) => office.includes(user.tag)) ?? [];
    }
    const weekdaySnap = await this.admin
      .db()
      .collection('presence')
      .doc('weekday')
      .get();
    const userIds = (await weekdaySnap.data()?.[
      weekdayKeyBuilder(Date.now())
    ]) as User['slackUserId'][];
    let plannedForToday: User[] = [];
    if (userIds?.length > 0) {
      const plannedForTodayRef = await usersRef
        .where('slackUserId', 'in', userIds)
        .get();

      plannedForToday = plannedForTodayRef.docs.map(
        (doc) => doc.data() as User,
      );
    }
    const checkedInSet = new Set(
      physicallyCheckedIn.map((user) => user.slackUserId),
    );

    const userMap = [...physicallyCheckedIn, ...plannedForToday].reduce<
      Record<User['slackUserId'], InboundDto>
    >((acc, user) => {
      return {
        ...acc,
        [user.slackUserId]: {
          ...user,
          status: checkedInSet.has(user.slackUserId)
            ? presence.office[user.tag].status
            : 'PLANNED',
        },
      };
    }, {});

    return Object.values(userMap).sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  async getPlannedPresence(): Promise<UpcomingPresenceDto[]> {
    const snap = await this.admin
      .db()
      .collection('presence')
      .doc('weekday')
      .get();
    const weekday = (await snap.data()) as Weekday;
    const keys = getUpcomingWeekdayKeys();
    const userIdSet = [
      ...new Set(
        Object.values(weekday)
          .map((users) => users)
          .flat(),
      ),
    ];
    const userSnap = await this.admin
      .db()
      .collection('users')
      .where('slackUserId', 'in', userIdSet)
      .get();
    const users = userSnap.docs.map((doc) => doc.data() as User);
    return keys.reduce<UpcomingPresenceDto[]>((acc, key) => {
      return [
        ...acc,
        {
          key,
          weekday: weekdayKeyToDayStr(key),
          users: users.filter(({ slackUserId }) =>
            weekday[key]?.includes(slackUserId),
          ),
        },
      ];
    }, []);
  }

  async setPlannedPresence(
    dates: string[],
    userId: User['slackUserId'],
  ): Promise<void> {
    const ref = this.admin.db().collection('presence').doc('weekday');

    const keys = getUpcomingWeekdayKeys();
    const data = (await ref.get()).data() as Weekday;

    keys.forEach((key) => {
      if (dates.includes(key)) {
        data[key] = [...new Set([...data[key], userId])];
      } else {
        data[key] = data[key]?.filter((id) => id !== userId) ?? [];
      }
    });

    await ref.set({ ...data });
  }

  async checkUser(tag: User['tag']): Promise<{ status: Status }> {
    const ref = this.admin.db().collection('presence').doc('state');
    const snapshot = await ref.get();
    const presence = snapshot.data() as OfficePresence;
    if (
      !Object.keys(presence.office).includes(tag) ||
      (Object.keys(presence.office).includes(tag) &&
        presence.office[tag].status === 'OUTBOUND')
    ) {
      await ref.set({
        office: { ...presence.office, [tag]: { status: 'INBOUND' } },
      });
      return { status: 'INBOUND' };
    } else {
      await ref.set({
        office: {
          ...presence.office,
          [tag]: { status: 'OUTBOUND' },
        },
      });
      return { status: 'OUTBOUND' };
    }
  }
}

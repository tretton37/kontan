import { Injectable } from '@nestjs/common';
import { Admin } from './Admin';
import {
  getUpcomingWeekdayKeys,
  weekdayKeyBuilder,
  weekdayKeyToDayStr,
} from '../utils';
import { User } from './UserService';

export type Status = 'INBOUND' | 'OUTBOUND' | 'PLANNED' | 'PLANNED_NO_TAG';
export interface InboundDto extends User {
  status: Status;
}

type OfficePresence = {
  office: Record<User['slackUserId'], { status: Status }>;
};

export interface UpcomingPresenceDto {
  key: string;
  weekday: string;
  users: User[];
}

export interface Office {
  id: string;
}

type Weekday = Record<string, User['slackUserId'][]>;

@Injectable()
export class OfficeService {
  constructor(private readonly admin: Admin) {}
  async incrementDays(): Promise<void> {
    const statuses = await this.admin
      .db()
      .collection('statuses')
      .get()
      .then((coll) => coll.docs.map((d) => d.data()));
    const yesterday = weekdayKeyBuilder(Date.now() - 24 * 60 * 60 * 1000);
    const statusesToDelete = statuses.filter((s) => s.key === yesterday);
    statusesToDelete.forEach((s) => {
      this.admin.db().collection('statuses').doc(s.id).delete();
    });

    const offices = await this.getOffices();
    offices.forEach(async (office) => {
      const ref = this.admin
        .db()
        .collection('presence')
        .doc(`weekday_${office.id}`);

      const dayKeys = getUpcomingWeekdayKeys(false);
      const data = (await ref.get()).data() as Weekday;
      delete data?.[yesterday];
      data[dayKeys[dayKeys.length - 1]] = [];
      await ref.set({ ...data });
    });
  }

  async resetInbound(): Promise<void> {
    const offices = await this.getOffices();
    offices.forEach(async (office) => {
      const ref = this.admin
        .db()
        .collection('presence')
        .doc(`state_${office.id}`);
      await ref.set({ office: {} });
    });
  }

  async whoIsInbound(office: string): Promise<InboundDto[]> {
    const ref = this.admin.db().collection('presence').doc(`state_${office}`);
    const snapshot = await ref.get();

    const presence = snapshot.data() as OfficePresence;
    const officePresence = Object.keys(presence.office);
    const usersRef = this.admin.db().collection('users');
    let checkedIn: User[] = [];

    if (officePresence?.length > 0) {
      checkedIn =
        (
          await usersRef.get().then((users) => {
            return users.docs.map((doc) => doc.data() as User);
          })
        )?.filter((user) => officePresence.includes(user.slackUserId)) ?? [];
    }
    const weekdaySnap = await this.admin
      .db()
      .collection('presence')
      .doc(`weekday_${office}`)
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
    const checkedInSet = new Set(checkedIn.map((user) => user.slackUserId));

    const userMap = [...checkedIn, ...plannedForToday].reduce<
      Record<User['slackUserId'], InboundDto>
    >((acc, user) => {
      return {
        ...acc,
        [user.slackUserId]: {
          ...user,
          status: checkedInSet.has(user.slackUserId)
            ? presence.office[user.slackUserId].status
            : 'PLANNED',
        },
      };
    }, {});

    return Object.values(userMap).sort((a, b) => (a.name > b.name ? 1 : -1));
  }

  async getPlannedPresence(office: string): Promise<UpcomingPresenceDto[]> {
    const snap = await this.admin
      .db()
      .collection('presence')
      .doc(`weekday_${office}`)
      .get();
    const weekday = snap.data() as Weekday;
    if (!weekday) {
      return [];
    }
    const keys = getUpcomingWeekdayKeys();
    const userIdSet = [
      ...new Set(
        Object.values(weekday)
          .map((users) => users)
          .flat(),
      ),
    ];
    if (userIdSet.length === 0) {
      return [];
    }
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

  async setPlannedPresence(dates: string[], user: User): Promise<void> {
    const offices = await this.getOffices();
    const office = user.office ?? offices[0].id;
    const ref = this.admin.db().collection('presence').doc(`weekday_${office}`);

    const keys = getUpcomingWeekdayKeys();
    const data = (await ref.get()).data() as Weekday;
    if (!data) return;

    keys.forEach((key) => {
      if (dates.includes(key)) {
        data[key] = [...new Set([...data[key], user.slackUserId])];
      } else {
        data[key] = data[key]?.filter((id) => id !== user.slackUserId) ?? [];
        this.removeStatusMessage(user, key);
      }
    });

    await ref.set({ ...data });
  }

  async checkUser(
    userId: User['slackUserId'],
    office: string,
  ): Promise<{ status: Status }> {
    const ref = this.admin.db().collection('presence').doc(`state_${office}`);
    const snapshot = await ref.get();
    const presence = snapshot.data() as OfficePresence;
    if (
      !Object.keys(presence.office).includes(userId) ||
      (Object.keys(presence.office).includes(userId) &&
        presence.office[userId].status === 'OUTBOUND')
    ) {
      await ref.set({
        office: { ...presence.office, [userId]: { status: 'INBOUND' } },
      });
      return { status: 'INBOUND' };
    } else {
      await ref.set({
        office: {
          ...presence.office,
          [userId]: { status: 'OUTBOUND' },
        },
      });
      return { status: 'OUTBOUND' };
    }
  }

  async getOffices(): Promise<Office[]> {
    const snapshot = await this.admin.db().collection('offices').get();
    const offices = new Array<Office>();
    snapshot.forEach((doc) => {
      offices.push(doc.data() as Office);
    });

    return offices;
  }

  async getStatusMessagesForOffice(office: string): Promise<StatusMessage[]> {
    const snapshot = await this.admin
      .db()
      .collection('statuses')
      .where('office', '==', office)
      .get();

    const statuses = new Array<StatusMessage>();
    snapshot.forEach((s) => {
      statuses.push(s.data() as StatusMessage);
    });

    return statuses;
  }

  async setStatusMessage(
    user: User,
    dayKey: string,
    statusMessage: string,
  ): Promise<void> {
    const ref = this.admin.db().collection('statuses');
    await ref.doc(`${user.slackUserId}_${user.office}_${dayKey}`).set({
      slackUserId: user.slackUserId,
      dayKey: dayKey,
      text: statusMessage,
      id: `${user.slackUserId}_${user.office}_${dayKey}`,
      office: user.office,
    });
  }

  async removeStatusMessage(user: User, dayKey: string) {
    await this.admin
      .db()
      .collection('statuses')
      .doc(`${user.slackUserId}_${user.office}_${dayKey}`)
      .delete();
  }
}

export interface StatusMessage {
  slackUserId: User['slackUserId'];
  text: string;
  dayKey: string;
  id: string;
  office: string;
}

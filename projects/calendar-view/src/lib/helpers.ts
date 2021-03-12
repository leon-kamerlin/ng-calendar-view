import { CalendarEvent } from 'calendar-utils';
import { addMinutes } from 'date-fns';
import { SelectorView } from 'leon-angular-utils';
import { MetaEvent } from 'leon-angular-utils';
import { MatColor } from 'ng-components-leon';


export const floorToNearest = (amount: number, precision: number): number => {
    return Math.floor(amount / precision) * precision;
};

export const ceilToNearest = (amount: number, precision: number): number => {
    return Math.ceil(amount / precision) * precision;
};

export const hourSegments: SelectorView[] = [
    {
        value: 1,
        viewValue: '1'
    },
    {
        value: 2,
        viewValue: '2'
    },
    {
        value: 3,
        viewValue: '3'
    },
    {
        value: 4,
        viewValue: '4'
    },
    {
        value: 5,
        viewValue: '5'
    },
    {
        value: 6,
        viewValue: '6'
    },
];


export const defaultEvent: CalendarEvent<MetaEvent> = {
    id: undefined,
    title: 'An event',
    start: new Date(),
    end: addMinutes(new Date(), 30),
    color: MatColor.PURPLE,
    draggable: true,
    resizable: {
        beforeStart: true,
        afterEnd: true
    },
    meta: {
        services: [],
    }
};

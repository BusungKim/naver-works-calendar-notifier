/* global moment */
const data = parseInitialDataText();

function parseInitialDataText() {
    const scripts = document.body.getElementsByTagName('script');
    const filtered = Array.from(scripts).filter(s => s.innerText.includes('oInitialData'));
    const text = filtered[0].innerText;

    return {
        userNo: text.match(/"userNo":"([0-9]+)"/)[1],
        instanceCode: text.match(/"instanceCode":"([0-9]+)"/)[1],
        defaultCalendarId: text.match(/"defaultCalendarId":"([A-Za-z0-9-_]+)"/)[1],
        userTimezone: text.match(/"userTimezone":"([A-Za-z/]+)"/)[1]
    };
}

(async function() {
    let todaySchedules = await getTodaySchedules();

    const dataPollingIntervalSec = 10;

    setInterval(async () => {
        const nextTodaySchedules = await getTodaySchedules();
        if (nextTodaySchedules.length === 0) {
            return;
        }
        todaySchedules = nextTodaySchedules;
        console.log('schedule was just updated: ', todaySchedules);
    }, dataPollingIntervalSec * 1_000);

    async function getTodaySchedules() {
        const timeStamp = new Date().getTime();
        const scheduleQueryRange = [`${moment(timeStamp).format('YYYY-MM-DD HH:mm:ss')}`, `${moment(timeStamp).format('YYYY-MM-DD 23:59:59')}`];

        const res = await fetch('/ajax/GetScheduleList', {
            body: makeRequestBody(scheduleQueryRange),
            method: 'post'
        });

        if (!res.ok) {
            return [];
        }

        const responseBody = await res.json();
        return responseBody.retScheduleList.returnValue;
    }

    function makeRequestBody(scheduleQueryRange = []) {
        const body = {
            calendarUidWithInstanceCodeList: [{
                calendarId: data.defaultCalendarId,
                instanceCode: data.instanceCode
            }],
            startDate: scheduleQueryRange[0],
            endDate: scheduleQueryRange[1],
            userTimezone: data.userTimezone,
        };

        const formData = new FormData();
        formData.append('bo', JSON.stringify(body));
        formData.append('localUserId', data.userNo);

        return formData;
    }
}());

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-US": require("date-fns/locale/en-US") };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales
});

export default function TaskCalendar({ tasks }) {
  const events = tasks.map((t) => ({
    title: t.name,
    start: new Date(t.start),
    end: new Date(t.end)
  }));

  return (
    <div className="bg-white p-4 rounded-xl shadow-md mt-10">
      <h2 className="text-xl font-bold mb-3">Calendar View</h2>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
      />
    </div>
  );
}

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import "react-big-calendar/lib/css/react-big-calendar.css";
import enUS from "date-fns/locale/en-US";

const locales = { "en-US": enUS };
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
    end: new Date(t.end),
    allDay: false,
    critical: t.custom_class === "critical"
  }));

  // Custom event styling
  const eventStyleGetter = (event) => {
    const bg = event.critical ? "#e63946" : "#4361ee";
    return {
      style: {
        backgroundColor: bg,
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "none",
        padding: "4px"
      }
    };
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl p-6 rounded-xl shadow-xl mt-10 border border-white/40">
      <h2 className="text-2xl font-bold mb-3">📅 Calendar View</h2>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        eventPropGetter={eventStyleGetter}
        style={{ height: 500, borderRadius: "12px" }}
      />
    </div>
  );
}

import { 
  GanttComponent, 
  Inject, 
  Selection, 
  ColumnsDirective, 
  ColumnDirective 
} from "@syncfusion/ej2-react-gantt";

import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-react-gantt/styles/material.css";

export default function GanttChart({ tasks }) {
  const formattedTasks = tasks.map((t) => ({
    ...t,
    startDate: new Date(t.start),
    endDate: new Date(t.end),

    // FIX: Convert dependencies array → string
    predecessor: t.dependencies?.length
      ? t.dependencies.map((d) => `${d}`).join(",")
      : null,

    taskClass: t.custom_class === "critical" ? "critical-task" : "normal-task"
  }));

  return (
    <div className="p-6 mt-8 bg-white/70 backdrop-blur-xl rounded-xl shadow-xl border border-white/40">
      <h2 className="text-2xl font-bold mb-4">📊 Gantt Timeline</h2>

      <style>
        {`
        .critical-task { fill: #e63946 !important; }
        .normal-task { fill: #4361ee !important; }
        `}
      </style>

      <GanttComponent
        dataSource={formattedTasks}
        taskFields={{
          id: "id",
          name: "name",
          startDate: "startDate",
          endDate: "endDate",
          progress: "progress",
          dependency: "predecessor"
        }}
        height="460px"
        rowHeight={40}
        taskbarHeight={25}
        allowSelection={true}
        highlightWeekends={true}
        splitterSettings={{ columnIndex: 2 }}
        labelSettings={{ leftLabel: "name" }}
      >
        <ColumnsDirective>
          <ColumnDirective field="id" headerText="ID" width="60" />
          <ColumnDirective field="name" headerText="Task" width="200" />
          <ColumnDirective field="start" headerText="Start" width="140" />
          <ColumnDirective field="end" headerText="End" width="140" />
        </ColumnsDirective>

        <Inject services={[Selection]} />
      </GanttComponent>
    </div>
  );
}

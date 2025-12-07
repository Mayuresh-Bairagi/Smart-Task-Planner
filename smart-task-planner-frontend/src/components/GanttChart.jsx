// Gantt.jsx
import {
  GanttComponent,
  Inject,
  Selection,
  ColumnsDirective,
  ColumnDirective
} from "@syncfusion/ej2-react-gantt";

import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-react-gantt/styles/material.css";

export default function Gantt({ tasks, holidays = [] }) {
  const formattedTasks = tasks.map((t) => ({
    TaskID: t.id,
    TaskName: t.name,
    StartDate: new Date(t.start),
    EndDate: new Date(t.end),
    Progress: t.progress || 0
  }));

  const formattedHolidays = holidays.map(h => ({
    from: new Date(h),
    to: new Date(h),
    label: "Holiday"
  }));

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      <style>
        {`
          .critical-task { fill: #e63946 !important; }
          .normal-task { fill: #4361ee !important; }
        `}
      </style>

      <GanttComponent
        dataSource={formattedTasks}
        height="450px"
        taskFields={{
          id: "TaskID",
          name: "TaskName",
          startDate: "StartDate",
          endDate: "EndDate",
          progress: "Progress"
        }}
        holidays={formattedHolidays}
        rowHeight={40}
        taskbarHeight={25}
        allowSelection={true}
        highlightWeekends={true}
        workWeek={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']}
        labelSettings={{ leftLabel: "TaskName" }}
        connectorLineBackground="transparent"
        connectorLineWidth={0}
      >
        <ColumnsDirective>
          <ColumnDirective field="TaskID" headerText="ID" width="70" />
          <ColumnDirective field="TaskName" headerText="Task Name" width="200" />
          <ColumnDirective field="StartDate" headerText="Start" width="140" />
          <ColumnDirective field="EndDate" headerText="End" width="140" />
        </ColumnsDirective>

        <Inject services={[Selection]} />
      </GanttComponent>
    </div>
  );
}

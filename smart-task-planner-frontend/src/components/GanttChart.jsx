import { GanttComponent, Inject, Selection } from "@syncfusion/ej2-react-gantt";

export default function GanttChart({ tasks }) {
  return (
    <GanttComponent
      dataSource={tasks}
      taskFields={{
        id: "id",
        name: "name",
        startDate: "start",
        endDate: "end",
        progress: "progress"
      }}
      height="450px"
      allowSelection={true}
    >
      <Inject services={[Selection]} />
    </GanttComponent>
  );
}

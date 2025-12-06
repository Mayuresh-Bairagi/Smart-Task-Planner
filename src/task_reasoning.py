from logger.customlogger import CustomLogger
from expection.customExpection import smartTaskPlannerException
from utils.model_loader import ModelLoader
from langchain_core.output_parsers import JsonOutputParser
from langchain.output_parsers import OutputFixingParser
from model.model import *
from Prompt.prompt_lib import PROMPT_REGISTRY


class TaskResoning:
    def __init__(self) -> None:
        try:
            self.logger = CustomLogger()
            self.logger = self.logger.get_logger(__file__)
            self.loader = ModelLoader()

            self.llm = self.loader.load_llm()
            self.parser = JsonOutputParser(pydantic_object=TaskReasoningOutput)

            self.prompt = PROMPT_REGISTRY["taskReasoning"]
            self.fixing_parser = OutputFixingParser.from_llm(parser=self.parser, llm=self.llm)
            self.chain = self.prompt | self.llm | self.fixing_parser
        except Exception as e:
            self.logger.error(f"Error initializing task reasoning :{e}")
            raise smartTaskPlannerException(f"Error initializing TaskReasoning :{e}")
        
    def generate_tasks(self, goal: str, constraints: str) -> TaskReasoningOutput:
        try:
            format_instructions = self.parser.get_format_instructions()
            prompt_filled = {
                "goal": goal,
                "constraints": constraints,
                "format_instructions": format_instructions
            }
            self.logger.info(f"Prompt for task reasoning generated.")
            result = self.chain.invoke(prompt_filled)
            self.logger.info(f"Task reasoning completed successfully.")
            return result
        except Exception as e:
            self.logger.error(f"Error generating tasks: {e}")
            raise smartTaskPlannerException(f"Error generating tasks: {e}")
        
if __name__ == "__main__":
    tr = TaskResoning()
    goal = "Develop a mobile application for task management."
    constraints = "The app must be cross-platform and support offline functionality."
    tasks_output = tr.generate_tasks(goal, constraints)
    print(tasks_output)
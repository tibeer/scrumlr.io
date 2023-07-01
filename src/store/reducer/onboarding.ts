import {Action, ReduxAction} from "store/action";
import {OnboardingColumn, OnboardingPhase, OnboardingState} from "types/onboarding";

interface OnboardingPhaseSteps {
  name: OnboardingPhase;
  steps: number;
}

export const phaseSteps: OnboardingPhaseSteps[] = [
  {name: "none", steps: 0},
  {name: "intro", steps: 3},
  {name: "newBoard", steps: 4},
  {name: "board_check_in", steps: 3},
  {name: "board_data", steps: 5},
  {name: "board_insights", steps: 5},
  {name: "board_actions", steps: 4},
  {name: "board_check_out", steps: 3},
  {name: "outro", steps: 1},
];

const initialState: OnboardingState = {
  phase: phaseSteps.find((p) => (sessionStorage.getItem("onboarding_phase") as OnboardingPhase)?.includes(p.name))?.name ?? "none",
  step: JSON.parse(sessionStorage.getItem("onboarding_step") ?? "1"),
  stepOpen: JSON.parse(sessionStorage.getItem("onboarding_stepOpen") ?? "true"),
  onboardingColumns: JSON.parse(sessionStorage.getItem("onboarding_columns") ?? "[]"),
  inUserTask: JSON.parse(sessionStorage.getItem("onboarding_inUserTask") ?? "false"),
  fakeVotesOpen: JSON.parse(sessionStorage.getItem("onboarding_fakeVotesOpen") ?? "false"),
  spawnedActionNotes: JSON.parse(sessionStorage.getItem("onboarding_spawnedActionNotes") ?? "false"),
  spawnedBoardNotes: JSON.parse(sessionStorage.getItem("onboarding_spawnedBoardNotes") ?? "false"),
};

// eslint-disable-next-line @typescript-eslint/default-param-last
export const onboardingReducer = (state: OnboardingState = initialState, action: ReduxAction): OnboardingState => {
  switch (action.type) {
    case Action.ChangePhase: {
      return {
        ...state,
        phase: action.phase,
        step: 1,
        stepOpen: true,
        inUserTask: false,
      };
    }
    case Action.IncrementStep: {
      const currentPhaseIndex = phaseSteps.findIndex((p) => p.name === state.phase);
      const increment = action.amount ?? 1;
      if (state.step + increment > phaseSteps[currentPhaseIndex].steps) {
        return {
          ...state,
          phase: phaseSteps[currentPhaseIndex + 1].name,
          step: 1,
          stepOpen: true,
          inUserTask: false,
        };
      }
      return {
        ...state,
        step: state.step + increment,
        stepOpen: true,
      };
    }
    case Action.DecrementStep: {
      const currentPhaseIndex = phaseSteps.findIndex((p) => p.name === state.phase);
      const decrement = action.amount ?? 1;
      if (state.step - decrement < 1) {
        if (currentPhaseIndex === 0) {
          return {
            ...state,
            step: 1,
            stepOpen: true,
            inUserTask: false,
          };
        }
        return {
          ...state,
          phase: phaseSteps[currentPhaseIndex - 1].name,
          step: phaseSteps[currentPhaseIndex - 1].steps,
          stepOpen: true,
          inUserTask: false,
        };
      }
      return {
        ...state,
        step: state.step - decrement,
        stepOpen: true,
        inUserTask: false,
      };
    }
    case Action.SwitchPhaseStep: {
      const desiredPhase = phaseSteps.find((phase) => phase.name === action.phase);
      if (desiredPhase && action.step >= 1 && action.step <= desiredPhase.steps) {
        return {
          ...state,
          phase: action.phase,
          step: action.step,
          stepOpen: true,
          inUserTask: false,
        };
      }
      return state;
    }
    case Action.ToggleStepOpen: {
      return {
        ...state,
        stepOpen: !state.stepOpen,
      };
    }
    case Action.RegisterOnboardingColumns: {
      const newOnboardingColumns: OnboardingColumn[] = [];
      if (state.phase !== "none") {
        const onboardingColumnNames = ["Mad", "Sad", "Glad", "Actions", "Start", "Stop", "Continue"];
        action.columns.forEach((c) => {
          if (onboardingColumnNames.includes(c.name)) {
            newOnboardingColumns.push({id: c.id, name: c.name});
          }
        });
        return {
          ...state,
          onboardingColumns: newOnboardingColumns,
        };
      }
      return state;
    }
    case Action.ClearOnboardingColumns: {
      return {
        ...state,
        onboardingColumns: [],
      };
      break;
    }
    case Action.SetInUserTask: {
      return {
        ...state,
        inUserTask: action.inTask,
      };
    }
    case Action.SetFakeVotesOpen: {
      return {
        ...state,
        fakeVotesOpen: action.fakesOpen,
      };
    }
    case Action.SetSpawnedNotes: {
      if (action.notesType === "board") {
        return {
          ...state,
          spawnedBoardNotes: action.spawned,
        };
      }
      if (action.notesType === "action") {
        return {
          ...state,
          spawnedActionNotes: action.spawned,
        };
      }
      return state;
    }
    default:
      return state;
  }
};

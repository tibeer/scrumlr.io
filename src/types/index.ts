import {BoardState} from "./board";
import {VotesState} from "./vote";
import {AuthState} from "./auth";
import {RequestsState} from "./request";
import {VotingsState} from "./voting";
import {ColumnsState} from "./column";
import {ParticipantsState} from "./participant";
import {NotesState} from "./note";
import {ViewState} from "./view";
import {AssigneeState} from "./assignee";

export interface ApplicationState {
  auth: AuthState;
  board: BoardState;
  requests: RequestsState;
  participants: ParticipantsState;
  columns: ColumnsState;
  notes: NotesState;
  votes: VotesState;
  votings: VotingsState;
  view: ViewState;
  assignees: AssigneeState;
}

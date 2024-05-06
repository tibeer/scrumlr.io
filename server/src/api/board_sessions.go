package api

import (
	"net/http"
	"scrumlr.io/server/identifiers"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/render"
	"github.com/google/uuid"
	"scrumlr.io/server/common"
	"scrumlr.io/server/common/dto"
	"scrumlr.io/server/database"
	"scrumlr.io/server/logger"
)

// getBoardSessions get participants
func (s *Server) getBoardSessions(w http.ResponseWriter, r *http.Request) {
	log := logger.FromRequest(r)

	board := r.Context().Value(identifiers.BoardIdentifier).(uuid.UUID)

	filter := database.BoardSessionFilterTypeFromQueryString(r.URL.Query())
	sessions, err := s.sessions.List(r.Context(), board, filter)
	if err != nil {
		log.Errorw("unable to get board sessions", "err", err)
		common.Throw(w, r, common.InternalServerError)
		return
	}

	render.Status(r, http.StatusOK)
	render.Respond(w, r, sessions)
}

// getBoardSession get a participant
func (s *Server) getBoardSession(w http.ResponseWriter, r *http.Request) {
	board := r.Context().Value(identifiers.BoardIdentifier).(uuid.UUID)
	userParam := chi.URLParam(r, "session")
	user, err := uuid.Parse(userParam)
	if err != nil {
		common.Throw(w, r, common.BadRequestError(err))
		return
	}

	session, err := s.sessions.Get(r.Context(), board, user)
	if err != nil {
		common.Throw(w, r, err)
		return
	}

	render.Status(r, http.StatusOK)
	render.Respond(w, r, session)
}

// updateBoardSession updates a participant
func (s *Server) updateBoardSession(w http.ResponseWriter, r *http.Request) {
	board := r.Context().Value(identifiers.BoardIdentifier).(uuid.UUID)
	caller := r.Context().Value(identifiers.UserIdentifier).(uuid.UUID)
	userParam := chi.URLParam(r, "session")
	user, err := uuid.Parse(userParam)
	if err != nil {
		common.Throw(w, r, common.BadRequestError(err))
		return
	}

	var body dto.BoardSessionUpdateRequest
	if err := render.Decode(r, &body); err != nil {
		common.Throw(w, r, common.BadRequestError(err))
		return
	}

	body.Board = board
	body.Caller = caller
	body.User = user

	session, err := s.sessions.Update(r.Context(), body)
	if err != nil {
		common.Throw(w, r, err)
		return
	}

	render.Status(r, http.StatusOK)
	render.Respond(w, r, session)
}

// updateBoardSessions updates all participants
func (s *Server) updateBoardSessions(w http.ResponseWriter, r *http.Request) {
	board := r.Context().Value(identifiers.BoardIdentifier).(uuid.UUID)

	var body dto.BoardSessionsUpdateRequest
	if err := render.Decode(r, &body); err != nil {
		common.Throw(w, r, common.BadRequestError(err))
		return
	}

	body.Board = board
	sessions, err := s.sessions.UpdateAll(r.Context(), body)
	if err != nil {
		common.Throw(w, r, err)
		return
	}

	render.Status(r, http.StatusOK)
	render.Respond(w, r, sessions)
}

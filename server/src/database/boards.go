package database

import (
	"context"
	"errors"
	"github.com/google/uuid"
	"github.com/uptrace/bun"
	"scrumlr.io/server/common"
	"scrumlr.io/server/database/types"
	"time"
)

type Board struct {
	bun.BaseModel         `bun:"table:boards"`
	ID                    uuid.UUID
	Name                  *string
	AccessPolicy          types.AccessPolicy
	Passphrase            *string
	Salt                  *string
	ShowAuthors           bool
	ShowNotesOfOtherUsers bool
	ShowNoteReactions     bool
	AllowStacking         bool
	CreatedAt             time.Time
	TimerStart            *time.Time
	TimerEnd              *time.Time
	SharedNote            uuid.NullUUID
	ShowVoting            uuid.NullUUID
}

type BoardInsert struct {
	bun.BaseModel `bun:"table:boards"`
	Name          *string
	AccessPolicy  types.AccessPolicy
	Passphrase    *string
	Salt          *string
}

type BoardTimerUpdate struct {
	bun.BaseModel `bun:"table:boards"`
	ID            uuid.UUID
	TimerStart    *time.Time
	TimerEnd      *time.Time
}

type BoardUpdate struct {
	bun.BaseModel         `bun:"table:boards"`
	ID                    uuid.UUID
	Name                  *string
	AccessPolicy          *types.AccessPolicy
	Passphrase            *string
	Salt                  *string
	ShowAuthors           *bool
	ShowNotesOfOtherUsers *bool
	ShowNoteReactions     *bool
	AllowStacking         *bool
	TimerStart            *time.Time
	TimerEnd              *time.Time
	SharedNote            uuid.NullUUID
	ShowVoting            uuid.NullUUID
}

type BoardColumns struct {
	bun.BaseModel `bun:"table:board_columns"`
	Board         uuid.UUID
	Columns       []uuid.UUID
}

func (d *Database) CreateBoard(creator uuid.UUID, board BoardInsert, columns []ColumnInsert) (Board, error) {
	if board.AccessPolicy == types.AccessPolicyByPassphrase && (board.Passphrase == nil || board.Salt == nil) {
		return Board{}, errors.New("passphrase or salt may not be empty")
	} else if board.AccessPolicy != types.AccessPolicyByPassphrase && (board.Passphrase != nil || board.Salt != nil) {
		return Board{}, errors.New("passphrase or salt should not be set for policies except 'BY_PASSPHRASE'")
	}

	insertBoard := d.db.NewInsert().
		Model(&board).
		Returning("id")

	insertSession := d.db.NewInsert().
		Model(&BoardSessionInsert{User: creator, Role: types.SessionRoleOwner}).
		Value("board", "(SELECT id FROM \"insertBoard\")")

	insertColumns := d.db.NewInsert().
		Model(&columns).
		Value("board", "(SELECT id FROM \"insertBoard\")").
		Returning("id")

	insertColumnOrder := d.db.NewInsert().
		Model(&BoardColumns{}).
		Value("board", "(SELECT id FROM \"insertBoard\")").
		Value("columns", "(SELECT array_agg(id::uuid) FROM \"insertColumns\")")

	selectBoard := d.db.NewSelect().
		Model(&Board{}).
		Table("insertBoard").
		ColumnExpr("*")

	var b Board
	err := selectBoard.
		With("insertBoard", insertBoard).
		With("insertSession", insertSession).
		With("insertColumns", insertColumns).
		With("insertColumnsOrder", insertColumnOrder).
		Scan(context.Background(), &b)

	return b, err
}

func (d *Database) UpdateBoardTimer(update BoardTimerUpdate) (Board, error) {
	var board Board
	_, err := d.db.NewUpdate().Model(&update).Column("timer_start", "timer_end").Where("id = ?", update.ID).Returning("*").Exec(common.ContextWithValues(context.Background(), "Database", d, "Result", &board), &board)
	return board, err
}

func (d *Database) UpdateBoard(update BoardUpdate) (Board, error) {
	query := d.db.NewUpdate().Model(&update).Column("timer_start", "timer_end", "shared_note")

	if update.Name != nil {
		query.Column("name")
	}
	if update.AccessPolicy != nil {
		if *update.AccessPolicy == types.AccessPolicyByPassphrase && (update.Passphrase == nil || update.Salt == nil) {
			return Board{}, errors.New("passphrase and salt should be set when access policy is updated")
		} else if *update.AccessPolicy != types.AccessPolicyByPassphrase && (update.Passphrase != nil || update.Salt != nil) {
			return Board{}, errors.New("passphrase and salt should not be set if access policy is defined as 'BY_PASSPHRASE'")
		}

		if *update.AccessPolicy == types.AccessPolicyByInvite {
			query.Where("access_policy = ?", types.AccessPolicyByInvite)
		} else {
			query.Where("access_policy <> ?", types.AccessPolicyByInvite)
		}

		query.Column("access_policy", "passphrase", "salt")
	}
	if update.ShowAuthors != nil {
		query.Column("show_authors")
	}
	if update.ShowNotesOfOtherUsers != nil {
		query.Column("show_notes_of_other_users")
	}
	if update.ShowNoteReactions != nil {
		query.Column("show_note_reactions")
	}
	if update.AllowStacking != nil {
		query.Column("allow_stacking")
	}

	var board Board
	var err error
	if update.ShowVoting.Valid {
		votingQuery := d.db.NewSelect().
			Model((*Voting)(nil)).
			Column("id").
			Where("board = ?", update.ID).
			Where("id = ?", update.ShowVoting.UUID).
			Where("status = ?", types.VotingStatusClosed)

		_, err = query.
			With("voting", votingQuery).
			With("rankUpdate", d.getRankUpdateQueryForClosedVoting("voting")).
			Set("voting = (SELECT \"id\" FROM \"voting\")").
			Where("id = ?", update.ID).
			Returning("*").
			Exec(common.ContextWithValues(context.Background(), "Database", d, "Result", &board), &board)
	} else {
		_, err = query.
			Where("id = ?", update.ID).
			Returning("*").
			Exec(common.ContextWithValues(context.Background(), "Database", d, "Result", &board), &board)
	}

	return board, err

}

func (d *Database) DeleteBoard(id uuid.UUID) error {
	_, err := d.db.NewDelete().Model((*Board)(nil)).Where("id = ?", id).Exec(common.ContextWithValues(context.Background(), "Database", d, "Board", id))
	return err
}

func (d *Database) GetBoard(id uuid.UUID) (Board, error) {
	var board Board
	err := d.db.NewSelect().Model(&board).Where("id = ?", id).Scan(context.Background())
	return board, err
}

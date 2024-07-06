import React, {useEffect, useRef, useState} from "react";
import {getColorClassName} from "constants/colors";
import {ColumnProps} from "components/Column";
import {MenuBars} from "components/MenuBars";
import {InfoBar} from "components/Infobar";
import {BoardHeader} from "components/BoardHeader";
import {HotkeyAnchor} from "components/HotkeyAnchor";
import "./Board.scss";
import {useDndMonitor} from "@dnd-kit/core";
import classNames from "classnames";
import {useStripeOffset} from "utils/hooks/useStripeOffset";

export interface BoardProps {
  children: React.ReactElement<ColumnProps> | React.ReactElement<ColumnProps>[];
  currentUserIsModerator: boolean;
  moderating: boolean;
}

export const BoardComponent = ({children, currentUserIsModerator, moderating}: BoardProps) => {
  const [dragActive, setDragActive] = useState(false);
  useDndMonitor({
    onDragStart() {
      setDragActive(true);
    },
    onDragEnd() {
      setDragActive(false);
    },
    onDragCancel() {
      setDragActive(false);
    },
  });

  const boardRef = useRef<HTMLDivElement>(null);

  const columnsCount = React.Children.count(children);

  // stripe offset for spacer divs
  const leftSpacerOffset = useStripeOffset<HTMLDivElement>({gradientLength: 40, gradientAngle: 45});
  const rightSpacerOffset = useStripeOffset<HTMLDivElement>({gradientLength: 40, gradientAngle: 45});

  useEffect(() => {
    leftSpacerOffset.updateOffset();
    rightSpacerOffset.updateOffset();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  if (!children || columnsCount === 0) {
    // Empty board
    return (
      <div className="board--empty">
        <style>{`.board { --board__columns: ${columnsCount} }`}</style>
        <BoardHeader currentUserIsModerator={currentUserIsModerator} />
        <InfoBar />
        <MenuBars showPreviousColumn={false} showNextColumn={false} onPreviousColumn={() => {}} onNextColumn={() => {}} />
        <HotkeyAnchor />
        <main className="board" ref={boardRef}>
          {/* Fixed color - can also be dynamic */}
          <div className={`board__spacer-left ${getColorClassName("backlog-blue")}`} {...leftSpacerOffset.bindings} />
          <div className={`board__spacer-right ${getColorClassName("backlog-blue")}`} {...rightSpacerOffset.bindings} />
        </main>
      </div>
    );
  }

  const columnColors = React.Children.map(children, (child) => child.props.color);

  const handlePreviousClick = () => {
    // TODO
  };

  const handleNextClick = () => {
    // TODO
  };

  return (
    <>
      <style>{`.board { --board__columns: ${columnsCount} }`}</style>
      <BoardHeader currentUserIsModerator={currentUserIsModerator} />
      <InfoBar />
      <MenuBars showPreviousColumn={false /* TODO */} showNextColumn={false /* TODO */} onPreviousColumn={handlePreviousClick} onNextColumn={handleNextClick} />
      <HotkeyAnchor />
      <main className={classNames("board", dragActive && "board--dragging")} ref={boardRef}>
        <div
          className={`board__spacer-left ${getColorClassName(columnColors[0])} ${currentUserIsModerator && moderating ? "board__spacer--moderation-isActive" : ""}`}
          {...leftSpacerOffset.bindings}
        />
        {children}
        <div
          className={`board__spacer-right  ${currentUserIsModerator && moderating ? "board__spacer--moderation-isActive" : ""} ${getColorClassName(
            columnColors[columnColors.length - 1]
          )}`}
          {...rightSpacerOffset.bindings}
        />
      </main>
    </>
  );
};

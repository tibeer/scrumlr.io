import {useTranslation} from "react-i18next";
import {Outlet, useLocation, useNavigate} from "react-router-dom";
import {useEffect, useState} from "react";
import {ScrumlrLogo} from "components/ScrumlrLogo";
import {UserPill} from "components/UserPill/UserPill";
import {SearchBar} from "components/SearchBar/SearchBar";
import {Switch} from "components/Switch/Switch";
import "./NewBoard.scss";

type BoardView = "templates" | "sessions";

export const NewBoard = () => {
  const {t} = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [boardView, setBoardView] = useState<BoardView>("templates");

  const getCurrentLocation = (): BoardView => (location.pathname.endsWith("/templates") ? "templates" : "sessions");

  useEffect(() => {
    const currentLocation = getCurrentLocation();
    setBoardView(currentLocation);
  }, [location]);

  const switchView = (location: string) => {
    navigate(location);
  };
  return (
    <div className="new-board">
      <div className="new-board__grid">
        {/* logo - - - profile */}
        <div>
          <a className="new-board__logo-wrapper" href="/" aria-label={t("BoardHeader.returnToHomepage")}>
            <ScrumlrLogo className="board-header__logo" accentColorClassNames={["accent-color--blue", "accent-color--purple", "accent-color--lilac", "accent-color--pink"]} />
          </a>
        </div>
        <UserPill className="new-board__user-pill" />

        {/* - - title - - */}
        <div className="new-board__title">Choose a template</div>

        {/* switch - - - search */}
        <Switch
          className="new-board__switch"
          activeDirection={boardView === "templates" ? "left" : "right"}
          leftText="Templates"
          onLeftSwitch={() => switchView("templates")}
          rightText="Saved Sessions"
          onRightSwitch={() => switchView("sessions")}
        />

        <SearchBar className="new-board__search-bar" />

        <main className="new-board__outlet">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

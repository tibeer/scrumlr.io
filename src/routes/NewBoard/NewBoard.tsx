import {API} from "api";
import "routes/NewBoard/NewBoard.scss";
import "components/Onboarding/Onboarding.scss";
import {useEffect, useState} from "react";
import {AccessPolicySelection} from "components/AccessPolicySelection";
import {AccessPolicy} from "types/board";
import {useTranslation} from "react-i18next";
import {useNavigate} from "react-router";
import {Link} from "react-router-dom";
import {useDispatch} from "react-redux";
import {Actions} from "store/action";
import {OnboardingController} from "components/Onboarding/OnboardingController";
import store from "store";
import {columnTemplates} from "./columnTemplates";
import {TextInputLabel} from "../../components/TextInputLabel";
import {TextInput} from "../../components/TextInput";
import {Button} from "../../components/Button";
import {ScrumlrLogo} from "../../components/ScrumlrLogo";

export const NewBoard = () => {
  const {t} = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [boardName, setBoardName] = useState<string | undefined>();
  const [columnTemplate, setColumnTemplate] = useState<string | undefined>(undefined);
  const [accessPolicy, setAccessPolicy] = useState(0);
  const [passphrase, setPassphrase] = useState("");
  const [extendedConfiguration, setExtendedConfiguration] = useState(false);
  const isOnboarding = window.location.pathname.startsWith("/onboarding");

  useEffect(() => {
    window.addEventListener(
      "beforeunload",
      () => {
        const {onboarding} = store.getState();
        sessionStorage.setItem("onboarding_phase", JSON.stringify(onboarding.phase));
        sessionStorage.setItem("onboarding_step", JSON.stringify(onboarding.step));
        sessionStorage.setItem("onboarding_stepOpen", JSON.stringify(onboarding.stepOpen));
        store.dispatch(Actions.leaveBoard());
      },
      false
    );

    window.addEventListener(
      "onunload",
      () => {
        const {onboarding} = store.getState();
        sessionStorage.setItem("onboarding_phase", JSON.stringify(onboarding.phase));
        sessionStorage.setItem("onboarding_step", JSON.stringify(onboarding.step));
        sessionStorage.setItem("onboarding_stepOpen", JSON.stringify(onboarding.stepOpen));
        store.dispatch(Actions.leaveBoard());
      },
      false
    );
  }, []);

  async function onCreateBoard() {
    let additionalAccessPolicyOptions = {};
    if (accessPolicy === AccessPolicy.BY_PASSPHRASE && Boolean(passphrase)) {
      additionalAccessPolicyOptions = {
        passphrase,
      };
    }

    if (columnTemplate) {
      // TODO: implement onboarding columns by adding new createBoard middleware function
      const boardId = await API.createBoard(
        boardName,
        {
          type: AccessPolicy[accessPolicy],
          ...additionalAccessPolicyOptions,
        },
        columnTemplates[columnTemplate].columns
      );
      if (!isOnboarding) {
        navigate(`/board/${boardId}`);
      } else {
        dispatch(Actions.changePhase("board_column"));
        dispatch(Actions.setFakeVotesOpen(false));
        dispatch(Actions.setSpawnedNotes("action", false));
        dispatch(Actions.setSpawnedNotes("board", false));
        navigate(`/onboarding-board/${boardId}`);
      }
    }
  }

  const isCreatedBoardDisabled = !columnTemplate || (accessPolicy === AccessPolicy.BY_PASSPHRASE && !passphrase);

  return (
    <div className="new-board__wrapper">
      {isOnboarding && <OnboardingController />}
      <div className="new-board">
        <div>
          <Link
            to="/"
            onClick={() => {
              dispatch(Actions.changePhase("none"));
            }}
          >
            <ScrumlrLogo accentColorClassNames={["accent-color--blue", "accent-color--purple", "accent-color--lilac", "accent-color--pink"]} />
          </Link>

          {!extendedConfiguration && (
            <div>
              <h1>{t("NewBoard.basicConfigurationTitle")}</h1>

              <div className="new-board__mode-selection">
                {Object.keys(columnTemplates).map((key) => (
                  <label key={key} className="new-board__mode">
                    <input
                      className="new-board__mode-input"
                      type="radio"
                      name="mode"
                      value={key}
                      onChange={(e) => setColumnTemplate(e.target.value)}
                      checked={columnTemplate === key}
                    />
                    <div className="new-board__mode-label">
                      <div>
                        <div className="new-board__mode-name">{columnTemplates[key].name}</div>
                        <div className="new-board__mode-description">{columnTemplates[key].description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {extendedConfiguration && (
            <div>
              <h1>{t("NewBoard.extendedConfigurationTitle")}</h1>

              <TextInputLabel label={t("NewBoard.boardName")}>
                <TextInput onChange={(e) => setBoardName(e.target.value)} />
              </TextInputLabel>

              <AccessPolicySelection accessPolicy={accessPolicy} onAccessPolicyChange={setAccessPolicy} passphrase={passphrase} onPassphraseChange={setPassphrase} />
            </div>
          )}
        </div>
      </div>
      <div className="new-board__actions">
        <Button className="new-board__action" onClick={onCreateBoard} color="primary" disabled={isCreatedBoardDisabled}>
          {t("NewBoard.createNewBoard")}
        </Button>
        {!extendedConfiguration && (
          <Button className="new-board__action new-board__extended" variant="outlined" color="primary" disabled={!columnTemplate} onClick={() => setExtendedConfiguration(true)}>
            {t("NewBoard.extendedConfigurationButton")}
          </Button>
        )}
        {extendedConfiguration && (
          <Button className="new-board__action" variant="outlined" color="primary" onClick={() => setExtendedConfiguration(false)}>
            {t("NewBoard.basicConfigurationButton")}
          </Button>
        )}
      </div>
    </div>
  );
};

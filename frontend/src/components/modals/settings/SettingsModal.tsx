/* eslint-disable prettier/prettier */
import { Spinner } from "@nextui-org/react";
import i18next from "i18next";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { fetchAgents, fetchModels } from "#/services/options";
import { AvailableLanguages } from "#/i18n";
import { I18nKey } from "#/i18n/declaration";
import Session from "#/services/session";
import { RootState } from "../../../store";
import { useNavigate } from "react-router-dom";
// import { Hanko } from "@teamhanko/hanko-elements";
import AgentState from "../../../types/AgentState";
import {
  Settings,
  getSettings,
  getDefaultSettings,
  getSettingsDifference,
  settingsAreUpToDate,
  maybeMigrateSettings,
  saveSettings,
} from "#/services/settings";
import toast from "#/utils/toast";
import BaseModal from "../base-modal/BaseModal";
import SettingsForm from "./SettingsForm";
import { clearID, clearToken, getID, getToken } from "#/services/auth";
import { clearMessages } from "#/state/chatSlice";

interface SettingsProps {
  isOpen: boolean;
  // eslint-disable-next-line prettier/prettier
  onOpenChange: (isOpen: boolean) => void;
}

const REQUIRED_SETTINGS = ["LLM_MODEL", "AGENT"];
const hankoApi = import.meta.env.VITE_HANKO_API_URL;
const BASEURL = import.meta.env.VITE_BACKEND_HOST

function SettingsModal({ isOpen, onOpenChange }: SettingsProps) {
  const { t } = useTranslation();

  const navigate = useNavigate();
  const [hanko, setHanko] = useState<Hanko>();
  const userID = getID()
  const [models, setModels] = React.useState<string[]>([]);
  const [agents, setAgents] = React.useState<string[]>([]);
  const [settings, setSettings] = React.useState<Settings>({} as Settings);
  const [agentIsRunning, setAgentIsRunning] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState(true);
  const { curAgentState } = useSelector((state: RootState) => state.agent);

  useEffect(() => {
    maybeMigrateSettings();
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    import("@teamhanko/hanko-elements").then(({ Hanko }) =>
      setHanko(new Hanko(hankoApi ?? ""))
    );
  }, []);

  useEffect(() => {
    const isRunning =
      curAgentState === AgentState.RUNNING ||
      curAgentState === AgentState.PAUSED ||
      curAgentState === AgentState.AWAITING_USER_INPUT;
    setAgentIsRunning(isRunning);
  }, [curAgentState]);

  React.useEffect(() => {
    (async () => {
      try {
        setModels(await fetchModels());
        setAgents(await fetchAgents());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleModelChange = (model: string) => {
    setSettings((prev) => ({
      ...prev,
      LLM_MODEL: model,
    }));
  };

  const handleAgentChange = (agent: string) => {
    setSettings((prev) => ({ ...prev, AGENT: agent }));
  };

  const handleLanguageChange = (language: string) => {
    const key =
      AvailableLanguages.find((lang) => lang.label === language)?.value ||
      language;
    // The appropriate key is assigned when the user selects a language.
    // Otherwise, their input is reflected in the inputValue field of the Autocomplete component.
    setSettings((prev) => ({ ...prev, LANGUAGE: key }));
  };

  const handleAPIKeyChange = (key: string) => {
    setSettings((prev) => ({ ...prev, LLM_API_KEY: key }));
  };

  const handleResetSettings = () => {
    setSettings(getDefaultSettings);
  };

  const handleSaveSettings = () => {
    const updatedSettings = getSettingsDifference(settings);
    saveSettings(settings);
    i18next.changeLanguage(settings.LANGUAGE);
    Session.startNewSession();

    const sensitiveKeys = ["LLM_API_KEY"];

    Object.entries(updatedSettings).forEach(([key, value]) => {
      if (!sensitiveKeys.includes(key)) {
        toast.settingsChanged(`${key} set to "${value}"`);
      } else {
        toast.settingsChanged(`${key} has been updated securely.`);
      }
    });

    localStorage.setItem(
      `API_KEY_${settings.LLM_MODEL || models[0]}`,
      settings.LLM_API_KEY,
    );
  };

  // Function to save the workspace to the database on logout
  const saveWorkspace = (): void => {
    fetch(`http://${BASEURL}/api/history/workspace/${userID}`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      }
    })
    .then(res => res.json())
    .then(res => {
      if(!res.ok){
        throw new Error('An error occured while saving the workspace') 
      }
    })
    .catch(console.log)
  }

  let subtitle = t(I18nKey.CONFIGURATION$MODAL_SUB_TITLE);
  if (loading) {
    subtitle = t(I18nKey.CONFIGURATION$AGENT_LOADING);
  } else if (agentIsRunning) {
    subtitle = t(I18nKey.CONFIGURATION$AGENT_RUNNING);
  } else if (!settingsAreUpToDate()) {
    subtitle = t(I18nKey.CONFIGURATION$SETTINGS_NEED_UPDATE_MESSAGE);
  }
  const saveIsDisabled = REQUIRED_SETTINGS.some(
    (key) => !settings[key as keyof Settings],
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t(I18nKey.CONFIGURATION$MODAL_TITLE)}
      isDismissable={settingsAreUpToDate()}
      subtitle={subtitle}
      actions={[
        {
          label: t(I18nKey.CONFIGURATION$MODAL_SAVE_BUTTON_LABEL),
          action: handleSaveSettings,
          isDisabled: saveIsDisabled,
          closeAfterAction: true,
          className: "bg-primary rounded-lg",
        },
        {
          label: t(I18nKey.CONFIGURATION$MODAL_RESET_BUTTON_LABEL),
          action: handleResetSettings,
          closeAfterAction: false,
          className: "bg-neutral-500 rounded-lg",
        },
        {
          label: t(I18nKey.CONFIGURATION$MODAL_CLOSE_BUTTON_LABEL),
          action: () => {
            setSettings(getSettings()); // reset settings from any changes
          },
          isDisabled: !settingsAreUpToDate(),
          closeAfterAction: true,
          className: "bg-rose-600 rounded-lg",
        },
        {
          label: 'Logout',
          action: async () => {
            try {
              saveWorkspace()
              await hanko?.user.logout();
              navigate("/login");
              clearID()
              clearToken()
              Session.disconnect()
              clearMessages()
            } catch (error) {
              console.error("Error during logout:", error);
            }
          },
          isDisabled: false,
          className: "bg-rose-600 rounded-lg"
        }
      ]}
    >
      {loading && <Spinner />}
      {!loading && (
        <SettingsForm
          disabled={agentIsRunning}
          settings={settings}
          models={models}
          agents={agents}
          onModelChange={handleModelChange}
          onAgentChange={handleAgentChange}
          onLanguageChange={handleLanguageChange}
          onAPIKeyChange={handleAPIKeyChange}
        />
      )}
    </BaseModal>
  );
}

export default SettingsModal;

import { useState, useEffect, useMemo } from "react";
import { Hanko } from "@teamhanko/hanko-elements";
import { setID } from "#/services/auth";

const hankoApi = import.meta.env.VITE_HANKO_API_URL; // for Vite

interface HankoSession {
  userID: string;
  jwt: string;
  isValid: boolean;
  loading: boolean;
  error: string | null;
}

export function useSessionData(): HankoSession {
  const hanko = useMemo(() => new Hanko(hankoApi), []);
  const [sessionState, setSessionState] = useState<HankoSession>({
    userID: "",
    jwt: "",
    isValid: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (hanko) {
      const isValid = hanko.session.isValid();
      const session = hanko.session.get();

      if (isValid && session) {
        const { userID, jwt = "" } = session;
        // console.clear()
        // console.info(userID);

        setID(userID)

        setSessionState({
          userID,
          jwt,
          isValid,
          loading: false,
          error: null,
        });
      } else {
        // alert('No session')
        setSessionState((prevState) => ({
          ...prevState,
          isValid: false,
          loading: false,
          error: "Invalid session",
        }));
      }
    }
  }, [hanko]);

  return sessionState;
}

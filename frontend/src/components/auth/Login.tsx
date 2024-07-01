/* eslint-disable prettier/prettier */
import React, { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { register, Hanko } from "@teamhanko/hanko-elements";
import { setID } from "#/services/auth";
import Session from "#/services/session";

const hankoApi = import.meta.env.VITE_HANKO_API_URL;

export default function HankoAuth() {
  const navigate = useNavigate();
  const hanko = useMemo(() => new Hanko(hankoApi), []);
  

  const redirectAfterLogin = useCallback(() => {
    hanko?.user
      .getCurrent()
      .then(({ id }) => {
        setID(id);
      })
      .catch(() => {
        setID("");
      });
    Session.startNewSession()
    navigate("/", {
      state: {initOnce: false}
    });
  }, [navigate]);

  useEffect(
    () =>
      hanko.onAuthFlowCompleted(() => {
        // Redirect to the main homepage after login has been completed.
        redirectAfterLogin();
      }),
    [hanko, redirectAfterLogin],
  );

  useEffect(() => {
    register(hankoApi).catch((error) => {
      // handle error
      console.log(error);
    });
  }, []);

  // eslint-disable-next-line react/react-in-jsx-scope
  return (
    <div className="w-screen h-screen flex justify-center items-center">
      <div>
        <hanko-auth />
      </div>
    </div>
  );
}

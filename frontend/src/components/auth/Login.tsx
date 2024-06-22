import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { register, Hanko } from "@teamhanko/hanko-elements";
import { clearMessages } from "#/state/chatSlice";

const hankoApi = import.meta.env.VITE_HANKO_API_URL;


export default function HankoAuth() {
  const navigate = useNavigate();
  const hanko = useMemo(() => new Hanko(hankoApi), []);
  

  const redirectAfterLogin = useCallback(() => {
    navigate("/", {
      state: {initOnce: false}
    });
  }, [navigate]);

  useEffect(
    () =>
      hanko.onAuthFlowCompleted(() => {
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

  // return <hanko-auth />;
}

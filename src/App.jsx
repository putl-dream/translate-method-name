import { useEffect, useState } from "react";
import Namer from "./Namer";
import Config from "./Config";

export default function App() {
  const [enterAction, setEnterAction] = useState({});
  const [route, setRoute] = useState("namer");

  useEffect(() => {
    if (!window.utools) return;

    const initRoute = async () => {
      try {
        // 检查是否有临时路由（从设置按钮跳转）
        const tmpRoute = await window.utools.db.promises.get("tmp_route");
        if (tmpRoute) {
          await window.utools.db.promises.remove("tmp_route");
          setRoute(tmpRoute);
          setEnterAction({});
          return;
        }
      } catch (err) {
        console.error("获取临时路由失败", err);
      }

      // 正常的插件入口
      window.utools.onPluginEnter((action) => {
        setRoute(action.code || "namer");
        setEnterAction(action);
      });
    };

    initRoute();

    window.utools.onPluginOut((isKill) => {
      setRoute("");
    });
  }, []);

  if (route === "namer") {
    return <Namer enterAction={enterAction} onNavigate={setRoute} />;
  }

  if (route === "config") {
    return <Config onNavigate={setRoute} />;
  }

  return false;
}

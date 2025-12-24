import { getTranslations } from "next-intl/server";
import Link from "next/dist/client/link";

export default async function Page() {
  const t = await getTranslations("login");

  return (
    <>
      {/* <div>{t("hey")}</div>
      <Link locale={"pt"} href={"/"}>
        Change to PT
      </Link>
      <Link locale={"en"} href={"/"}>
        Change to EN
      </Link> */}

      <div className="flex-1 flex justify-center items-center">
        <div className="w-92 h-96 bg-zinc-800 rounded-lg p-2 flex flex-col justify-center items-center gap-4">
          <h1 className="text-2xl text-gray-200">Please Login</h1>
          <form
            action=""
            className="flex flex-col gap-4 justify-center items-center"
          >
            <div className="flex flex-col">
              <label className="text-gray-200 mb-1" htmlFor="username">
                {t("username")}
              </label>
              <input
                className="w-64 h-8 rounded-md bg-zinc-700 outline-0 outline-zinc-900 focus:outline-blue-700 text-gray-200 pl-2 focus:outline-1"
                type="text"
                name="username"
                id="username"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-200 mb-1" htmlFor="password">
                {t("password")}
              </label>
              <input
                className="w-64 h-8 rounded-md bg-zinc-700 outline-0 outline-zinc-900 focus:outline-blue-700 text-gray-200 pl-2 focus:outline-1"
                type="password"
                name="password"
                id="password"
              />
              <a
                href="#"
                className="text-sm text-zinc-400 mt-1 hover:text-blue-700 transition-colors"
              >
                {t("forgotPassword")}
              </a>
            </div>
            <button className="w-32 h-10 outline-2 outline-zinc-900 rounded-md hover:outline-0 hover:bg-blue-700 transition-all cursor-pointer text-gray-200">
              {t("login")}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

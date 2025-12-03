import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { title, subtitle } from "@/Components/Primitives";
import { GithubIcon } from "@/Components/Icons";
import { Navbar } from "@/Components/Navbar";
import { Background } from "@/Components/Background";
import { useSocket } from "@/Components/SocketContext";

export default function IndexPage() {
  const { IsGatewayConnected } = useSocket();

  return (
    <div className="relative flex flex-col h-screen">
      <Background />
      <Navbar />
      <main className="container mx-auto max-w-7xl px-6 grow pt-16 z-50">
        <div className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
          <div className="inline-block max-w-lg text-center justify-center">
            <span className={title()}>Remote&nbsp;</span>
            <span className={title({ color: "blue" })}>Control&nbsp;</span>
            <br />
            <span className={title()}>your computer from anywhere.</span>
            <div className={subtitle({ class: "mt-4" })}>
              A simple and easy to use remote control application.
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              isExternal
              className={buttonStyles({
                color: "primary",
                radius: "full",
                variant: "shadow",
              })}
              href={"google.com"}
            >
              Documentation
            </Link>
            <Link
              isExternal
              className={buttonStyles({ variant: "bordered", radius: "full" })}
              href={"google.com"}
            >
              <GithubIcon size={20} />
              GitHub
            </Link>
          </div>

          <div className="mt-8">
            <Snippet hideCopyButton hideSymbol variant="bordered">
              <span>
                Gateway connection status{" "}
                <Code color={IsGatewayConnected ? "success" : "danger"}>
                  {IsGatewayConnected ? "Connected" : "Disconnected"}
                </Code>
              </span>
            </Snippet>
          </div>
        </div>
      </main>
      <footer className="w-full flex items-center justify-center py-3">
        <Link
          isExternal
          className="flex items-center gap-1 text-current"
          href="https://heroui.com"
          title="heroui.com homepage"
        >
          <span className="text-default-600">Powered by</span>
          <p className="text-primary">HeroUI</p>
        </Link>
      </footer>
    </div>
  );
}

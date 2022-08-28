import { DEFAULT_ERROR_TITLE } from "../common/constants";
import { runAppleScript } from "run-applescript";
import { Tab } from "../lib/Tab";
import { executeJxa } from "../utils";

import {
  ActionPanel,
  closeMainWindow,
  CopyToClipboardAction,
  Icon,
  List,
  popToRoot,
  showToast,
  ToastStyle,
} from "@raycast/api";

export function TabListItem(props: { tab: Tab; useOriginalFavicon: boolean }) {
  const p = props || {tab:{}};
  const subtitle = p && p.tab && p.tab.urlWithoutScheme? p.tab.urlWithoutScheme() : ""
  const urlDomain = p && p.tab && p.tab.urlDomain? p.tab.urlDomain() : ""
 
  return (
    <List.Item
      title={p.tab.app + '/' + p.tab.title}
      subtitle={subtitle}
      keywords={urlDomain}
      actions={<UrlListItemActions tab={p.tab} />}
      icon={props.useOriginalFavicon ? p.tab.favicon : p.tab.googleFavicon()}
    />
  );
  return (
    <List.Item
      title={props.tab.app + '/' + props.tab.title}
      subtitle={props.tab.urlWithoutScheme()}
      keywords={[props.tab.urlDomain()]}
      actions={<UrlListItemActions tab={props.tab} />}
      icon={props.useOriginalFavicon ? props.tab.favicon : props.tab.googleFavicon()}
    />
  );
}

async function setActiveTab(tab: Tab): Promise<void> {
    if (tab.app=='Edge'){
        await runAppleScript(`
            tell application "Microsoft Edge"
            activate
            set index of window (${tab.windowsIndex} as number) to (${tab.windowsIndex} as number)
            set active tab index of window (${tab.windowsIndex} as number) to (${tab.tabIndex} as number)
            end tell
        `);
    }
    if (tab.app=='Chrome'){
        await runAppleScript(`
            tell application "Google Chrome"
            activate
            set index of window (${tab.windowsIndex} as number) to (${tab.windowsIndex} as number)
            set active tab index of window (${tab.windowsIndex} as number) to (${tab.tabIndex} as number)
            end tell
        `);
    }
    if (tab.app=='Safari'){
        executeJxa(`
            const safari = Application("Safari");
            safari.activate();
            const window = safari.windows.byId(${tab.windowsIndex});
            const tab = window.tabs[${tab.tabIndex - 1}];
            window.index = 1;
            window.currentTab = tab;
            safari.activate();
        `);
    }
}

function UrlListItemActions(props: { tab: Tab }) {
  return (
    <ActionPanel title={props.tab.title}>
      <MicrosoftEdgeGoToTab tab={props.tab} />
      <CopyToClipboardAction title="Copy URL" content={props.tab.url} />
    </ActionPanel>
  );
}

function MicrosoftEdgeGoToTab(props: { tab: Tab }) {
  async function handleAction() {
    try {
      await setActiveTab(props.tab);
      await closeMainWindow({ clearRootSearch: true });
      return await popToRoot();
    } catch (error) {
      showToast(ToastStyle.Failure, DEFAULT_ERROR_TITLE, "Couldn't go to tab");
    }
  }

  return <ActionPanel.Item title="Open Tab" icon={{ source: Icon.Eye }} onAction={handleAction} />;
}

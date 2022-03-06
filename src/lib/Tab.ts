import { faviconUrl } from "../utils/urlUtils";

export class Tab {
  static readonly TAB_CONTENTS_SEPARATOR: string = "~~~";

  constructor(
    public readonly title: string,
    public readonly url: string,
    public readonly favicon: string,
    public readonly windowsIndex: number,
    public readonly tabIndex: number,
    public readonly app: string
  ) {}

  static parse(line: string): Tab {
    const parts = line.split(this.TAB_CONTENTS_SEPARATOR);

    return new Tab(parts[0], parts[1], parts[2], +parts[3], +parts[4], parts[5]);
  }

  key(): string {
    return `${this.app}${this.windowsIndex}${Tab.TAB_CONTENTS_SEPARATOR}${this.tabIndex}`;
  }

  urlWithoutScheme(): string {
    return this.url.replace(/(^\w+:|^)\/\//, "").replace("www.", "");
  }

  urlDomain(): string {
    return this.urlWithoutScheme().split("/")[0];
  }

  googleFavicon(): string {
    return faviconUrl(64, this.url);
  }
}

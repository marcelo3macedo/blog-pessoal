// amp-img isn't part of the standard JSX HTML element catalog, so TSX needs
// it declared here to type-check.
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type AmpImgProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string;
  alt?: string;
  layout?: string;
  height?: string | number;
  width?: string | number;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "amp-img": AmpImgProps;
    }
  }
}

export {};

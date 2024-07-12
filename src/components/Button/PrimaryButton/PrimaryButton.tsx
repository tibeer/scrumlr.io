import React from "react";
import classNames from "classnames";
import "./PrimaryButton.scss";

type PrimaryButtonProps = {
  children?: React.ReactNode;
  className?: string;
  small?: boolean;
  icon?: React.ReactNode;

  onClick?: () => void;
};

export const PrimaryButton = (props: PrimaryButtonProps) => (
  <button className={classNames("primary-button", {"primary-button--small": props.small, "primary-button--with-icon": props.icon}, props.className)}>
    {props.children}
    {props.icon}
  </button>
);

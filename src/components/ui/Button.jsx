import "./Button.scss";

export default function Button({
  as = "button",
  variant = "primary",
  className = "",
  children,
  ...rest
}) {
  const Tag = as;
  return (
    <Tag className={`btn btn--${variant} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}

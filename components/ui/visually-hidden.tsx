import { VisuallyHidden as RadixVisuallyHidden } from "@radix-ui/react-visually-hidden";

interface VisuallyHiddenProps
  extends React.ComponentPropsWithoutRef<typeof RadixVisuallyHidden> {
  children: React.ReactNode;
}

export const VisuallyHidden = ({ children, ...props }: VisuallyHiddenProps) => {
  return <RadixVisuallyHidden></RadixVisuallyHidden>;
};

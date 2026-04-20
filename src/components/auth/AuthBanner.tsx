import React, { FC, ReactNode } from "react";
import Box from '../box/Box'
import {Text} from '../../ui'
import {BLUE_COLOR} from '../../theme/colors'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        "camera-controls"?: boolean;
        "auto-rotate"?: boolean;
        "shadow-intensity"?: string;
      }, HTMLElement>;
    }
  }
}

const AuthBanner: FC<Props> = ({ children, bgDark, bgLight }) => {

  return (
    <Box display={'flex'} flexDirection={'column'} justify={'center'}  align={'center'} height={'100%'} style={{background: 'radial-gradient(circle at 35% 40%, #ffffff 0%, #f5f9ff 35%, #eaf2ff 65%, #dbe8ff 100%)'}}>
      <Box display="flex" flexDirection="column" space={0.6} my={32}>
            <Box display={'flex'}>
              <Text heading="h3" weight="extraBold" color={'black'}>
                Your Sales Pipeline
              </Text>
            </Box>
            <Text heading="h5"  weight="bold" paragraph secondary color={BLUE_COLOR} align={'center'}>
              CLEAN, FOCUSE, UNDER CONTROL
            </Text>
      </Box>

      <model-viewer
          src="/snowflake.glb"
          alt="Snowflake"
          // camera-controls
          auto-rotate
          shadow-intensity="1"
          style={{ display: "block", width: "100%", height: "400px" }}
      />

      {/*<Box display="flex" flexDirection="column" space={0.6} my={32}>*/}
      {/*  <Box display={'flex'}>*/}
      {/*    <Text heading="h6" weight="light">*/}
      {/*      Track deals, manage follow-ups, and keep your sales pipeline moving - all in one place*/}
      {/*    </Text>*/}
      {/*  </Box>*/}
      {/*  /!*<Text varient="body2" weight="medium" paragraph secondary>*!/*/}
      {/*  /!*  Clean, focused, under control*!/*/}
      {/*  /!*</Text>*!/*/}
      {/*</Box>*/}

      <h5 style={{fontWeight: 400}}>

      </h5>
    </Box>
  );
};
export default AuthBanner;
interface Props {
  children?: ReactNode;
  bgDark: string;
  bgLight: string;
}

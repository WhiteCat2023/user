import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { Center } from "@/components/ui/center";
import { Image } from "@/components/ui/image";
import {
  FormControl,
  FormControlLabel,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
  FormControlHelper,
  FormControlHelperText,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { AlertCircleIcon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { useState } from "react";


export default function Index() {

    const [isInvalid, setIsInvalid] = useState(false);
    const [inputValue, setInputValue] = useState("12345");
  return (
    <VStack>
      <Center>
        <Image
          source={{
            uri: require("../assets/images/ariba-logo.png"),
            width: 200,
            height: 200,
          }}
        />
        <FormControl
          isInvalid={isInvalid}
          size="3xl"
          isDisabled={false}
          isReadOnly={false}
          isRequired={false}
        >
          <FormControlLabel>
            <FormControlLabelText size="lg">Password</FormControlLabelText>
          </FormControlLabel>
          <Input className="my-1" size="lg">
            <InputField
              type="password"
              placeholder="password"
              value={inputValue}
              onChangeText={(text) => setInputValue(text)}
            />
          </Input>
          <FormControlHelper>
            <FormControlHelperText size="md">
              Must be at least 6 characters.
            </FormControlHelperText>
          </FormControlHelper>
          <FormControlError>
            <FormControlErrorIcon
              as={AlertCircleIcon}
              className="text-red-500"
            />
            <FormControlErrorText className="text-red-500">
              At least 6 characters are required.
            </FormControlErrorText>
          </FormControlError>
        </FormControl>
      </Center>
    </VStack>
  );
}

import { Input, InputField, InputIcon, InputSlot } from '@/components/ui/input'
import { Search } from 'lucide-react-native'

const SearchBar = ({ value, onChangeText, placeholder }) => {
  return (
    <Input
      variant="outline"
      size="md"
      isDisabled={false}
      isInvalid={false}
      isReadOnly={false}
      className="bg-white rounded-xl flex-1"
    >
      <InputSlot className="ms-3">
        <InputIcon as={Search} />
      </InputSlot>

      <InputField
        value={value}                // ✅ controlled input
        onChangeText={onChangeText}  // ✅ updates parent state
        placeholder={placeholder || "Search"}
      />
    </Input>
  )
}

export default SearchBar

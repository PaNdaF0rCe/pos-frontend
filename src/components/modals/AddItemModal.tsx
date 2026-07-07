import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useEffect } from "react";
import SearchInput, { SearchOption } from "../SearchInput";
import { useListCategories } from "../../db/hooks/dbHooks";
import { useState } from "react";
import { addItem } from "../../db/mutations/itemMutate";
import { Item } from "../../types/Item.type";

export default function MyModal({
  isOpen,
  setIsOpen,
  item,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  item?: Item;
}) {
  const [name, setName] = useState(item?.name || "");
  const [price, setPrice] = useState<number | undefined>(item?.price);
  const [stock, setStock] = useState<number | undefined>(item?.stock);
  const [hasOptions, setHasOptions] = useState(false);
  const [categories] = useListCategories();
  const [selectedCategory, setSelectedCategory] = useState<SearchOption>(
    categories?.find((cat) => cat.id === item?.category) || {
      id: "-1",
      name: "",
    }
  );
  const [img, setImg] = useState(item?.imgUrl || "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(item?.name || "");
    setPrice(item?.price);
    setStock(item?.stock);
    setHasOptions(item?.options || false);
    setSelectedCategory(
      categories?.find((cat) => cat.id === item?.category) || {
        id: "-1",
        name: "",
      }
    );
    setImg(item?.imgUrl || "");
  }, [item, categories]);

  function closeModal() {
    setIsOpen(false);
  }

  async function handleSubmitButton() {
    await addItem(
      name,
      selectedCategory.id!,
      price!,
      stock!,
      hasOptions,
      img,
      item?.id || undefined
    );
  }

  const enable =
    name?.length > 0 &&
    price! > 0 &&
    stock! > 0 &&
    hasOptions !== undefined &&
    selectedCategory.id !== "-1";

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/75" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    {item ? "Edit" : "Add"} Item
                  </Dialog.Title>

                  <img
                    className="w-24 h-24 rounded-full mx-auto my-4 object-fill"
                    src={
                      img ||
                      "https://upload.wikimedia.org/wikipedia/commons/1/14/No_Image_Available.jpg"
                    }
                    alt=""
                  />

                  <div className="mt-2 gap-3 flex flex-col">
                    <div>
                      <label
                        className="block font-semibold text-neutral-500 text-sm"
                        htmlFor="name"
                      >
                        Name
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter Name"
                        name="name"
                        className="border text-md placeholder:text-sm rounded-lg w-full outline-purple-400 px-3 py-1"
                        type="text"
                      />
                    </div>

                    <div>
                      <label
                        className="block font-semibold text-neutral-500 text-sm"
                        htmlFor="category"
                      >
                        Category
                      </label>
                      <SearchInput
                        placeholder="Enter Category"
                        selected={selectedCategory}
                        setSelected={setSelectedCategory}
                        items={categories!}
                      />
                    </div>

                    <div>
                      <label
                        className="block font-semibold text-neutral-500 text-sm"
                        htmlFor="price"
                      >
                        Price
                      </label>
                      <input
                        onChange={(e) => setPrice(parseInt(e.target.value))}
                        value={price}
                        placeholder="Enter Price"
                        name="price"
                        className="border placeholder:text-sm rounded-lg w-full outline-purple-400 px-3 py-1"
                        type="number"
                      />
                    </div>

                    <div>
                      <label
                        className="block font-semibold text-neutral-500 text-sm"
                        htmlFor="stock"
                      >
                        Stock
                      </label>
                      <input
                        onChange={(e) => setStock(parseInt(e.target.value))}
                        value={stock}
                        placeholder="Enter Stock"
                        name="stock"
                        className="border placeholder:text-sm rounded-lg w-full outline-purple-400 px-3 py-1"
                        type="number"
                      />
                    </div>

                    <div>
                      <label
                        className="block font-semibold text-neutral-500 text-sm"
                        htmlFor="image"
                      >
                        Image URL
                      </label>
                      <input
                        onChange={(e) => setImg(e.target.value)}
                        value={img}
                        placeholder="Enter Image URL"
                        name="image"
                        className="border placeholder:text-sm rounded-lg w-full outline-purple-400 px-3 py-1"
                        type="text"
                      />
                    </div>

                    <div className="flex gap-6 mt-2">
                      <label
                        className="block font-semibold text-neutral-500 text-sm"
                        htmlFor="options"
                      >
                        Enable Options?{" "}
                        <span className="font-light text-sm">
                          e.g. Small, Medium, Large
                        </span>
                      </label>
                      <input
                        onChange={(e) => setHasOptions(e.target.checked)}
                        checked={hasOptions}
                        name="options"
                        className="flex-start w-5 h-5 accent-purple-400 bg-white"
                        type="checkbox"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={submitting || !enable}
                      className="flex mx-auto disabled:cursor-not-allowed mt-8 justify-center rounded-md border border-transparent bg-purple-400 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-700 focus-visible:ring-offset-2"
                      onClick={async () => {
                        setSubmitting(true);
                        await handleSubmitButton();
                        setSubmitting(false);
                        closeModal();
                      }}
                    >
                      {submitting
                        ? "Submitting..."
                        : `${item ? "Edit Item!" : "Add Item!"}`}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}

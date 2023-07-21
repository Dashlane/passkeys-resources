"use client";

import { useState } from "react";
import Image from "next/image";
import data from "../../public/domains.json";
import emptyIcon from "../../public/link.svg";
import passkeyIcon from "../../public/passkey.svg";
import searchIcon from "../../public/search.svg";
import dashlaneIcon from "../../public/dashlane.svg";

type SortedField = "domain" | "name";

const Page = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [sortedField, setSortedField] = useState<SortedField>("domain");
    const [sortedAscending, setSortedAscending] = useState(true);

    const filteredData = data.filter((item) => item.domain.toLowerCase().includes(searchTerm.toLowerCase()));

    const sortData = (field: SortedField) => {
        if (sortedField === field) {
            setSortedAscending(!sortedAscending);
        } else {
            setSortedField(field);
            setSortedAscending(true);
        }
    };

    const sortedData = sortedField
        ? [...filteredData].sort((a, b) => {
              const fieldA = a[sortedField].toLowerCase();
              const fieldB = b[sortedField].toLowerCase();

              if (fieldA < fieldB) return sortedAscending ? -1 : 1;
              if (fieldA > fieldB) return sortedAscending ? 1 : -1;
              return 0;
          })
        : filteredData;

    return (
        <>
            <div className="background-major px-4 py-8">
                <div className="mx-auto max-w-xl flex flex-col justify-center">
                    <h1 className="text-3xl text-center font-bold mb-4 color-major">
                        <Image alt="Passkey icon" height={40} src={passkeyIcon} className="inline pb-1 mr-1" />
                        Passkeys Directory
                    </h1>

                    <p className="text-sm text-center text-gray-500 dark:text-white mb-6">
                        Passkeys Directory is a community-driven index of websites, apps, and services that offer
                        signing in with passkeys.
                    </p>

                    <a href="https://www.dashlane.com" target="_blank">
                        <Image alt="Dashlane logo" height={30} src={dashlaneIcon} className="mx-auto mb-6" />
                    </a>

                    <form className="mb-4 relative">
                        <input
                            type="text"
                            placeholder="Search by domain"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 text-gray-600 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full pr-10"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Image alt="Search icon" height={20} src={searchIcon} />
                        </div>
                    </form>
                </div>
            </div>

            <div className="container mx-auto px-12% py-8">
                <div className="border rounded-lg overflow-hidden overflow-x-auto border-gray-200 dark:border-gray-700">
                    <table className="table-fixed min-w-full divide-y divide-gray-200 dark:divide-gray-500 rounded-lg">
                        <thead>
                            <tr>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-slate-700 dark:text-white text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                    Icon
                                </th>
                                <th
                                    className="px-6 py-3 bg-gray-50 dark:bg-slate-700 dark:text-white text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => sortData("domain")}
                                >
                                    Domain
                                    {sortedField === "domain" && (
                                        <span className="ml-1">{sortedAscending ? "▲" : "▼"}</span>
                                    )}
                                </th>
                                <th
                                    className="px-6 py-3 bg-gray-50 dark:bg-slate-700 dark:text-white text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                                    onClick={() => sortData("name")}
                                >
                                    Name
                                    {sortedField === "name" && (
                                        <span className="ml-1">{sortedAscending ? "▲" : "▼"}</span>
                                    )}
                                </th>
                                <th className="px-6 py-3 bg-gray-50 dark:bg-slate-700 dark:text-white text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-600">
                            {sortedData.map((item, index) => (
                                <tr
                                    key={index}
                                    className="odd:bg-white even:bg-gray-100 hover:bg-gray-100 dark:odd:bg-gray-800 dark:even:bg-gray-700 dark:hover:bg-gray-700"
                                >
                                    <td className="px-6 py-4 whitespace-no-wrap">
                                        {item.icon !== "" ? (
                                            <img src={item.icon} alt={item.name} className="h-8 w-8" />
                                        ) : (
                                            <Image src={emptyIcon} alt={item.name} className="h-8 w-8" />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-no-wrap">
                                        <a href={"https://" + item.domain} rel="nofollow" target="_blank">
                                            {item.domain}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-no-wrap">
                                        {item.name !== ""
                                            ? item.name
                                            : item.domain.charAt(0).toUpperCase() + item.domain.slice(1)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-no-wrap">{item.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-center text-sm text-gray-500 dark:text-white mt-4">
                    {" "}
                    This website is provided by{" "}
                    <a
                        href="https://www.dashlane.com/"
                        className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    >
                        Dashlane
                    </a>{" "}
                    as a free resource for the community. Contribute on{" "}
                    <a
                        href="https://github.com/Dashlane/passkeys-resources"
                        className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                    >
                        GitHub
                    </a>
                    .
                </p>
            </div>
        </>
    );
};

export default Page;

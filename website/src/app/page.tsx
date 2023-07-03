"use client";

import { useState } from "react";
import Image from "next/image";
import data from "../../public/domains.json";
import emptyIcon from "../../public/link.svg";
import passkeyIcon from "../../public/passkey.svg";

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
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4 color-major">
                <Image alt="Passkey icon" height={40} src={passkeyIcon} className="inline pb-1 mr-1" />
                Passkeys Resources
            </h1>

            <form className="mb-4">
                <input
                    type="text"
                    placeholder="Search by domain"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 text-gray-600 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
            </form>

            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-500">
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
                            {sortedField === "domain" && <span className="ml-1">{sortedAscending ? "▲" : "▼"}</span>}
                        </th>
                        <th
                            className="px-6 py-3 bg-gray-50 dark:bg-slate-700 dark:text-white text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => sortData("name")}
                        >
                            Name
                            {sortedField === "name" && <span className="ml-1">{sortedAscending ? "▲" : "▼"}</span>}
                        </th>
                        <th className="px-6 py-3 bg-gray-50 dark:bg-slate-700 dark:text-white text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                            Description
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {sortedData.map((item, index) => (
                        <tr key={index}>
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
            <hr />
            <p className="text-sm text-gray-500 dark:text-white mt-4">
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
    );
};

export default Page;

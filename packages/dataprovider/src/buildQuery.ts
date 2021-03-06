import buildVariables from "./buildVariables";
import buildGqlQuery from "./buildGqlQuery";
import getResponseParser from "./getResponseParser";
import { IntrospectionResult } from "./constants/interfaces";
import { OurOptions } from "./types";

export const buildQueryFactory = (
  introspectionResults: IntrospectionResult,
  { resourceViews }: OurOptions = {},
) => {
  const knownResources = introspectionResults.resources.map((r) => r.type.name);

  return (aorFetchType: string, resourceName: string, params: any) => {
    const resourceView = resourceViews?.[resourceName];
    const isResourceView = Boolean(resourceView);
    const resourceNameToUse = isResourceView
      ? resourceView.resource
      : resourceName;
    const resource = introspectionResults.resources.find(
      (r) => r.type.name === resourceNameToUse,
    );

    if (!resource) {
      throw new Error(
        `Unknown resource ${resourceNameToUse}. Make sure it has been declared on your server side schema. Known resources are ${knownResources.join(
          ", ",
        )}. ${
          resourceViews
            ? `Known view resources are ${Object.keys(resourceViews).join(
                ", ",
              )}`
            : ""
        }`,
      );
    }

    const fragment = resourceView?.fragment ?? undefined;

    const variables = buildVariables(introspectionResults)(
      resource,
      aorFetchType,
      params,
    )!;

    const query = buildGqlQuery(introspectionResults)(
      resource,
      aorFetchType,
      variables,
      fragment,
    );
    const parseResponse = getResponseParser(introspectionResults, {
      shouldSanitizeLinkedResources: !isResourceView,
    })(aorFetchType, resource);

    return {
      query,
      variables,
      parseResponse,
    };
  };
};

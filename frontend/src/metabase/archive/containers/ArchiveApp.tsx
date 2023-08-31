import { useCallback, useEffect, useMemo } from "react";
import { t } from "ttag";
import _ from "underscore";

import { useSelector } from "metabase/lib/redux";

import type { EntityWrappedCollectionItem } from "metabase-types/api";

import Button from "metabase/core/components/Button";
import BulkActionBar from "metabase/components/BulkActionBar";
import Card from "metabase/components/Card";
import PageHeading from "metabase/components/type/PageHeading";
import { StackedCheckBox } from "metabase/components/StackedCheckBox";
import VirtualizedList from "metabase/components/VirtualizedList";

import Search from "metabase/entities/search";
import { useListSelect } from "metabase/hooks/use-list-select";

import { getIsNavbarOpen, openNavbar } from "metabase/redux/app";
import { getUserIsAdmin } from "metabase/selectors/user";
import { isSmallScreen, getMainElement } from "metabase/lib/dom";
import ArchivedItem from "../../components/ArchivedItem";

import {
  ArchiveBarContent,
  ArchiveBarText,
  ArchiveBody,
  ArchiveEmptyState,
  ArchiveHeader,
  ArchiveRoot,
} from "./ArchiveApp.styled";

const ROW_HEIGHT = 68;

interface ArchiveAppRootProps {
  list: EntityWrappedCollectionItem[];
  reload: () => void;
}

function ArchiveAppRoot({ list, reload }: ArchiveAppRootProps) {
  const mainElement = useMemo(() => getMainElement(), []);
  useEffect(() => {
    if (!isSmallScreen()) {
      openNavbar();
    }
  }, []);

  const { clear, getIsSelected, selected, selectOnlyTheseItems, toggleItem } =
    useListSelect<EntityWrappedCollectionItem>(
      item => `${item.model}:${item.id}`,
    );

  const selectAllItems = useCallback(() => {
    selectOnlyTheseItems(list);
  }, [list, selectOnlyTheseItems]);

  const allSelected = useMemo(
    () => selected.length === list.length,
    [selected, list],
  );

  const isNavbarOpen = useSelector(getIsNavbarOpen);
  const isAdmin = useSelector(getUserIsAdmin);

  return (
    <ArchiveRoot>
      <ArchiveHeader>
        <PageHeading>{t`Archive`}</PageHeading>
      </ArchiveHeader>
      <ArchiveBody>
        <Card
          style={{
            height: list.length > 0 ? ROW_HEIGHT * list.length : "auto",
          }}
        >
          {list.length > 0 ? (
            <VirtualizedList
              scrollElement={mainElement}
              items={list}
              rowHeight={ROW_HEIGHT}
              renderItem={({ item }: { item: EntityWrappedCollectionItem }) => (
                <ArchivedItem
                  type={item.type || ""}
                  name={item.getName()}
                  icon={item.getIcon().name}
                  color={item.getColor()}
                  isAdmin={isAdmin}
                  onUnarchive={async () => {
                    if (item.setArchived !== undefined) {
                      await item.setArchived(false);
                      reload();
                    }
                  }}
                  onDelete={async () => {
                    if (item.delete !== undefined) {
                      await item.delete();
                      reload();
                    }
                  }}
                  selected={getIsSelected(item)}
                  onToggleSelected={() => toggleItem(item)}
                  showSelect={selected.length > 0}
                />
              )}
            />
          ) : (
            <ArchiveEmptyState>
              <h2>{t`Items you archive will appear here.`}</h2>
            </ArchiveEmptyState>
          )}
        </Card>
      </ArchiveBody>
      <BulkActionBar isNavbarOpen={isNavbarOpen} showing={selected.length > 0}>
        <ArchiveBarContent>
          <SelectionControls
            allSelected={allSelected}
            selectAll={selectAllItems}
            clear={clear}
          />
          <BulkActionControls selected={selected} reload={reload} />
          <ArchiveBarText>{t`${selected.length} items selected`}</ArchiveBarText>
        </ArchiveBarContent>
      </BulkActionBar>
    </ArchiveRoot>
  );
}

export const ArchiveApp = _.compose(
  Search.loadList({
    query: { archived: true },
    reload: true,
    wrapped: true,
  }),
)(ArchiveAppRoot);

const BulkActionControls = ({
  selected,
  reload,
}: {
  selected: any[];
  reload: () => void;
}) => (
  <span>
    <Button
      className="ml1"
      medium
      onClick={async () => {
        try {
          await Promise.all(
            selected.map(item => item.setArchived && item.setArchived(false)),
          );
        } finally {
          reload();
        }
      }}
    >{t`Unarchive`}</Button>
    <Button
      className="ml1"
      medium
      onClick={async () => {
        try {
          await Promise.all(selected.map(item => item.delete && item.delete()));
        } finally {
          reload();
        }
      }}
    >{t`Delete`}</Button>
  </span>
);

const SelectionControls = ({
  allSelected,
  selectAll,
  clear,
}: {
  allSelected: boolean;
  selectAll: () => void;
  clear: () => void;
}) =>
  allSelected ? (
    <StackedCheckBox checked={true} onChange={clear} />
  ) : (
    <StackedCheckBox checked={false} onChange={selectAll} />
  );

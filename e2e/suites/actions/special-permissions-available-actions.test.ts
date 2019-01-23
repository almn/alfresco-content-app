/*!
 * @license
 * Alfresco Example Content Application
 *
 * Copyright (C) 2005 - 2018 Alfresco Software Limited
 *
 * This file is part of the Alfresco Example Content Application.
 * If the software was purchased under a paid Alfresco license, the terms of
 * the paid license agreement will prevail.  Otherwise, the software is
 * provided under the following open source license terms:
 *
 * The Alfresco Example Content Application is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The Alfresco Example Content Application is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

import { LoginPage, BrowsingPage, SearchResultsPage } from '../../pages/pages';
import { SITE_VISIBILITY, SITE_ROLES, FILES } from '../../configs';
import { RepoClient } from '../../utilities/repo-client/repo-client';
import { Utils } from '../../utilities/utils';
import { Viewer } from '../../components/viewer/viewer';

describe('Granular permissions available actions : ', () => {
  const userConsumer = `consumer-${Utils.random()}`;
  const userManager = `manager-${Utils.random()}`;

  const siteName = `site-private-${Utils.random()}`;
  const file1 = `my-file1-${Utils.random()}.txt`;
  let file1Id;
  const file2 = `my-file2-${Utils.random()}.txt`;
  let file2Id;
  const file3 = `my-file3-${Utils.random()}.txt`;
  let file3Id;

  const folder1 = `my-folder1-${Utils.random()}`;
  let folder1Id;
  const folder2 = `my-folder2-${Utils.random()}`;
  let folder2Id;

  const docxFile = FILES.docxFile;
  let docxFileId;

  const apis = {
    admin: new RepoClient(),
    userConsumer: new RepoClient(userConsumer, userConsumer),
    userManager: new RepoClient(userManager, userManager)
  };

  const loginPage = new LoginPage();
  const page = new BrowsingPage();
  const { dataTable, toolbar } = page;
  const contextMenu = dataTable.menu;
  const viewer = new Viewer();
  const viewerToolbar = viewer.toolbar;
  const searchResultsPage = new SearchResultsPage();
  const { searchInput } = searchResultsPage.header;

  beforeAll(async (done) => {
    await apis.admin.people.createUser({ username: userConsumer });
    await apis.admin.people.createUser({ username: userManager });

    await apis.admin.sites.createSite(siteName, SITE_VISIBILITY.PRIVATE);
    const docLibId = await apis.admin.sites.getDocLibId(siteName);

    file1Id = (await apis.admin.nodes.createFile(file1, docLibId)).entry.id;
    file2Id = (await apis.admin.nodes.createFile(file2, docLibId)).entry.id;
    file3Id = (await apis.admin.nodes.createFile(file3, docLibId)).entry.id;
    folder1Id = (await apis.admin.nodes.createFolder(folder1, docLibId)).entry.id;
    folder2Id = (await apis.admin.nodes.createFolder(folder2, docLibId)).entry.id;

    docxFileId = (await apis.admin.upload.uploadFile(docxFile, docLibId)).entry.id;

    await apis.admin.sites.addSiteMember(siteName, userManager, SITE_ROLES.SITE_MANAGER.ROLE);
    await apis.admin.sites.addSiteMember(siteName, userConsumer, SITE_ROLES.SITE_CONSUMER.ROLE);

    await apis.admin.nodes.setGranularPermission(file3Id, false, userConsumer, SITE_ROLES.SITE_MANAGER.ROLE);

    await apis.userConsumer.shared.shareFileById(file1Id);
    await apis.userConsumer.shared.shareFileById(file2Id);
    await apis.userConsumer.shared.shareFileById(docxFileId);
    await apis.userConsumer.shared.shareFileById(file3Id);
    await apis.userConsumer.shared.waitForApi({ expect: 4 });

    await apis.userConsumer.favorites.addFavoritesByIds('file', [file1Id, file2Id, file3Id, docxFileId]);
    await apis.userConsumer.favorites.addFavoritesByIds('folder', [folder1Id, folder2Id]);
    await apis.userConsumer.favorites.waitForApi({ expect: 6 });

    await loginPage.loginWith(userConsumer);
    done();
  });

  afterAll(async (done) => {
    await apis.admin.sites.deleteSite(siteName);
    done();
  });

  xit('');

  describe('toolbar displays correct actions when selecting multiple files with different granular permissions', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('on File Libraries - [C280476]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.selectMultipleItems([file1, file2]);

      expect(await toolbar.isViewPresent()).toBe(false, `View is displayed for selected files`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for selected files`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for selected files`);
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for selected files`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for selected files`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for selected files`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for selected files`);
      await toolbar.closeMoreMenu();
    });

    it('on Shared Files - [C280477]', async () => {
      await page.clickSharedFilesAndWait();
      await dataTable.selectMultipleItems([file1, file2]);

      expect(await toolbar.isViewPresent()).toBe(false, `View is displayed for selected files`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for selected files`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for selected files`);
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for selected files`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for selected files`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for selected files`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for selected files`);
      await toolbar.closeMoreMenu();
    });

    it('on Favorites - [C280478]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.selectMultipleItems([file1, file2]);

      expect(await toolbar.isViewPresent()).toBe(false, `View is displayed for selected files`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for selected files`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for selected files`);
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for selected files`);
      // TODO: enable when ACA-1737 is done
      // expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for selected files`);
      // expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for selected files`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for selected files`);
      await toolbar.closeMoreMenu();
    });

    it('on Search Results - [C291823]', async () => {
      await searchInput.clickSearchButton();
      await searchInput.checkOnlyFiles();
      await searchInput.searchForTextAndCloseSearchOptions('my-file');
      await dataTable.selectMultipleItems([file1, file2]);

      expect(await toolbar.isViewPresent()).toBe(false, `View is displayed for selected files`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for selected files`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for selected files`);
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for selected files`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for selected files`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for selected files`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for selected files`);
      await toolbar.closeMoreMenu();
    });
  });

  describe('toolbar actions appear correctly for a file - consumer', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('on File Libraries - [C280455]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.selectItem(file1);
      expect(await toolbar.isViewPresent()).toBe(true, `View is not displayed for ${file1}`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for ${file1}`);
      expect(await toolbar.isViewDetailsPresent()).toBe(true, `View details is not displayed for ${file1}`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for ${file1}`);

      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for ${file1}`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for ${file1}`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for ${file1}`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${file1}`);
      await toolbar.closeMoreMenu();
    });

    it('on Shared Files - [C280456]', async () => {
      await page.clickSharedFilesAndWait();
      await page.dataTable.selectItem(file1);
      expect(await toolbar.isViewPresent()).toBe(true, `View is not displayed for ${file1}`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for ${file1}`);
      expect(await toolbar.isViewDetailsPresent()).toBe(true, `View details is not displayed for ${file1}`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for ${file1}`);
      await toolbar.openMoreMenu();

      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for ${file1}`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for ${file1}`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for ${file1}`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${file1}`);
      await toolbar.closeMoreMenu();
    });

    it('on Favorites - [C213121]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.selectItem(file1);
      expect(await toolbar.isViewPresent()).toBe(true, `View is not displayed for ${file1}`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for ${file1}`);
      expect(await toolbar.isViewDetailsPresent()).toBe(true, `View details is not displayed for ${file1}`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for ${file1}`);
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for ${file1}`);
      // TODO: enable when ACA-1737 is done
      // expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for ${file1}`);
      // expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for ${file1}`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${file1}`);
      await toolbar.closeMoreMenu();
    });

    it('on Search Results - [C291818]', async () => {
      await searchInput.clickSearchButton();
      await searchInput.checkOnlyFiles();
      await searchInput.searchForTextAndCloseSearchOptions(file1);
      await dataTable.selectItem(file1);

      expect(await toolbar.isViewPresent()).toBe(true, `View is not displayed for ${file1}`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for ${file1}`);
      expect(await toolbar.isViewDetailsPresent()).toBe(true, `View details is not displayed for ${file1}`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for ${file1}`);

      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for ${file1}`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for ${file1}`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for ${file1}`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${file1}`);
      await toolbar.closeMoreMenu();
    });
  });

  describe('toolbar actions appear correctly for a folder - consumer', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('on File Libraries - [C280444]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.selectItem(folder1);
      expect(await toolbar.isViewPresent()).toBe(false, `View is displayed for ${folder1}`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for ${folder1}`);
      expect(await toolbar.isViewDetailsPresent()).toBe(true, `View details is not displayed for ${folder1}`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for ${folder1}`);

      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for ${folder1}`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for ${folder1}`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for ${folder1}`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${folder1}`);
      await toolbar.closeMoreMenu();
    });

    it('on Favorites - [C286266]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.selectItem(folder1);
      expect(await toolbar.isViewPresent()).toBe(false, `View is not displayed for ${folder1}`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for ${folder1}`);
      expect(await toolbar.isViewDetailsPresent()).toBe(true, `View details is not displayed for ${folder1}`);
      // TODO: enable when ACA-1737 is done
      // expect(await toolbar.isEditButtonPresent()).toBe(false, `Edit is displayed for ${folder1}`);
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for ${folder1}`);
      // TODO: enable when ACA-1737 is done
      // expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for ${folder1}`);
      // expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for ${folder1}`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${folder1}`);
      await toolbar.closeMoreMenu();
    });

    it('on Search Results - [C291819]', async () => {
      await searchInput.clickSearchButton();
      await searchInput.checkOnlyFolders();
      await searchInput.searchForTextAndCloseSearchOptions(folder1);
      await dataTable.selectItem(folder1);

      expect(await toolbar.isViewPresent()).toBe(false, `View is displayed for ${folder1}`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for ${folder1}`);
      expect(await toolbar.isViewDetailsPresent()).toBe(true, `View details is not displayed for ${folder1}`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for ${folder1}`);

      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for ${folder1}`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for ${folder1}`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for ${folder1}`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${folder1}`);
      await toolbar.closeMoreMenu();
    });
  });

  describe('toolbar actions appear correctly for multiple selection of files - consumer', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('on File Libraries - [C280464]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.selectMultipleItems([file1, file2]);
      expect(await toolbar.isViewPresent()).toBe(false, 'View is displayed');
      expect(await toolbar.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await toolbar.isEditPresent()).toBe(false, 'Edit is displayed');
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      await toolbar.closeMoreMenu();
    });

    it('on Shared Files - [C286284]', async () => {
      await page.clickSharedFilesAndWait();
      await dataTable.selectMultipleItems([file1, file2]);
      expect(await toolbar.isViewPresent()).toBe(false, `View is displayed for selected files`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for selected files`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for selected files`);
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for selected files`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for selected files`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for selected files`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for selected files`);
      await toolbar.closeMoreMenu();
    });

    it('on Favorites - [C286285]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.selectMultipleItems([file1, file2]);
      expect(await toolbar.isViewPresent()).toBe(false, `View is displayed for selected files`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for selected files`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for selected files`);
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for selected files`);
      // TODO: enable when ACA-1737 is done
      // expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for selected files`);
      // expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for selected files`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for selected files`);
      await toolbar.closeMoreMenu();
    });

    it('on Search Results - [C291824]', async () => {
      await searchInput.clickSearchButton();
      await searchInput.checkOnlyFiles();
      await searchInput.searchForTextAndCloseSearchOptions('my-file');
      await dataTable.selectMultipleItems([file1, file2]);

      expect(await toolbar.isViewPresent()).toBe(false, 'View is displayed');
      expect(await toolbar.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await toolbar.isEditPresent()).toBe(false, 'Edit is displayed');
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      await toolbar.closeMoreMenu();
    });
  });

  describe('toolbar actions appear correctly for multiple selection of folders - consumer', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('on File Libraries - [C280465]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.selectMultipleItems([folder1, folder2]);
      expect(await toolbar.isViewPresent()).toBe(false, 'View is displayed');
      expect(await toolbar.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await toolbar.isEditPresent()).toBe(false, 'Edit is displayed');
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      await toolbar.closeMoreMenu();
    });

    it('on Favorites - [C286286]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.selectMultipleItems([folder1, folder2]);
      expect(await toolbar.isViewPresent()).toBe(false, `View is displayed for selected files`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for selected files`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for selected files`);
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for selected files`);
      // TODO: enable when ACA-1737 is done
      // expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for selected files`);
      // expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for selected files`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for selected files`);
      await toolbar.closeMoreMenu();
    });

    it('on Search Results - [C291825]', async () => {
      await searchInput.clickSearchButton();
      await searchInput.checkOnlyFolders();
      await searchInput.searchForTextAndCloseSearchOptions('my-folder');
      await dataTable.selectMultipleItems([folder1, folder2]);

      expect(await toolbar.isViewPresent()).toBe(false, 'View is displayed');
      expect(await toolbar.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await toolbar.isEditPresent()).toBe(false, 'Edit is displayed');
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      await toolbar.closeMoreMenu();
    });
  });

  describe('toolbar actions appear correctly for when both files and folders are selected - consumer', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('on File Libraries - [C280466]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.selectMultipleItems([file1, folder1]);
      expect(await toolbar.isViewPresent()).toBe(false, 'View is displayed');
      expect(await toolbar.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await toolbar.isEditPresent()).toBe(false, 'Edit is displayed');
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      await toolbar.closeMoreMenu();
    });

    it('on Favorites - [C286287]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.selectMultipleItems([file1, folder1]);
      expect(await toolbar.isViewPresent()).toBe(false, `View is displayed for selected files`);
      expect(await toolbar.isDownloadPresent()).toBe(true, `Download is not displayed for selected files`);
      expect(await toolbar.isEditPresent()).toBe(false, `Edit is displayed for selected files`);
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed for selected files`);
      // TODO: enable when ACA-1737 is done
      // expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed for selected files`);
      // expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed for selected files`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed for selected files`);
      await toolbar.closeMoreMenu();
    });

    it('on Search Results - [C291826]', async () => {
      await searchInput.clickSearchButton();
      await searchInput.checkFilesAndFolders();
      await searchInput.searchForTextAndCloseSearchOptions('my-f');
      await dataTable.selectMultipleItems([file1, folder1]);

      expect(await toolbar.isViewPresent()).toBe(false, 'View is displayed');
      expect(await toolbar.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await toolbar.isEditPresent()).toBe(false, 'Edit is displayed');
      await toolbar.openMoreMenu();
      expect(await toolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await toolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await toolbar.menu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await toolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      await toolbar.closeMoreMenu();
    });
  });

  describe('context menu actions are correct for a file - consumer', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('on File Libraries - [C280599]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.rightClickOnItem(file1);
      expect(await contextMenu.isDownloadPresent()).toBe(true, `Download is not displayed for ${file1}`);
      expect(await contextMenu.isViewPresent()).toBe(true, `View is not displayed for ${file1}`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${file1}`);
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed for ${file1}`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed for ${file1}`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed for ${file1}`);
      expect(await contextMenu.isSharePresent()).toBe(true, `Share is not displayed for ${file1}`);
      expect(await contextMenu.isManageVersionsPresent()).toBe(true, `Manage Versions not displayed for ${file1}`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed for ${file1}`);
      expect(await contextMenu.isEditPresent()).toBe(false, `Edit is displayed for ${file1}`);
      expect(await contextMenu.isViewDetailsPresent()).toBe(false, `View details is displayed for ${file1}`);
    });

    it('on Shared Files - [C286264]', async () => {
      await page.clickSharedFilesAndWait();
      await dataTable.rightClickOnItem(file1);
      expect(await contextMenu.isDownloadPresent()).toBe(true, `Download is not displayed for ${file1}`);
      expect(await contextMenu.isViewPresent()).toBe(true, `View is not displayed for ${file1}`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${file1}`);
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed for ${file1}`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed for ${file1}`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed for ${file1}`);
      // TODO: enable this when the action is properly implemented: ACA-92
      // expect(await contextMenu.isSharePresent()).toBe(true, `Share is not displayed for ${file1}`);
      expect(await contextMenu.isManageVersionsPresent()).toBe(true, `Manage Versions not displayed for ${file1}`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed for ${file1}`);
      expect(await contextMenu.isEditPresent()).toBe(false, `Edit is displayed for ${file1}`);
      expect(await contextMenu.isViewDetailsPresent()).toBe(false, `View details is displayed for ${file1}`);
    });

    it('on Favorites - [C286262]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.rightClickOnItem(file1);
      expect(await contextMenu.isDownloadPresent()).toBe(true, `Download is not displayed for ${file1}`);
      expect(await contextMenu.isViewPresent()).toBe(true, `View is not displayed for ${file1}`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${file1}`);
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed for ${file1}`);
      // TODO: enable when ACA-1737 is done
      // expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed for ${file1}`);
      // expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed for ${file1}`);
      expect(await contextMenu.isSharePresent()).toBe(true, `Share is not displayed for ${file1}`);
      expect(await contextMenu.isManageVersionsPresent()).toBe(true, `Manage Versions is not displayed for ${file1}`);
      // TODO: enable when ACA-1794 is fixed
      // expect(await contextMenu.isManagePermissionsPresent()).toBe(true, `Permissions is not displayed for ${file1}`);
      expect(await contextMenu.isEditPresent()).toBe(false, `Edit is displayed for ${file1}`);
      expect(await contextMenu.isViewDetailsPresent()).toBe(false, `View details is displayed for ${file1}`);
    });

    it('on Search Results - [C291829]', async () => {
      await searchInput.clickSearchButton();
      await searchInput.checkOnlyFiles();
      await searchInput.searchForTextAndCloseSearchOptions(file1);
      await dataTable.rightClickOnItem(file1);
      expect(await contextMenu.isDownloadPresent()).toBe(true, `Download is not displayed for ${file1}`);
      expect(await contextMenu.isViewPresent()).toBe(true, `View is not displayed for ${file1}`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${file1}`);
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed for ${file1}`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed for ${file1}`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed for ${file1}`);
      expect(await contextMenu.isSharePresent()).toBe(true, `Share is not displayed for ${file1}`);
      expect(await contextMenu.isManageVersionsPresent()).toBe(true, `Manage Versions not displayed for ${file1}`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed for ${file1}`);
      expect(await contextMenu.isEditPresent()).toBe(false, `Edit is displayed for ${file1}`);
      expect(await contextMenu.isViewDetailsPresent()).toBe(false, `View details is displayed for ${file1}`);
    });
  });

  describe('context menu actions are correct for a folder - consumer', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('on File Libraries - [C280600]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.rightClickOnItem(folder1);
      expect(await contextMenu.isDownloadPresent()).toBe(true, `Download is not displayed for ${folder1}`);
      expect(await contextMenu.isEditPresent()).toBe(false, `Edit is displayed for ${folder1}`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${folder1}`);
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed for ${folder1}`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed for ${folder1}`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed for ${folder1}`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed for ${folder1}`);
      expect(await contextMenu.isViewPresent()).toBe(false, `View is displayed for ${folder1}`);
      expect(await contextMenu.isManageVersionsPresent()).toBe(false, `Manage Versions displayed for ${folder1}`);
      expect(await contextMenu.isSharePresent()).toBe(false, `Share is displayed for ${folder1}`);
    });

    it('on Favorites - [C286263]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.rightClickOnItem(folder1);
      expect(await contextMenu.isDownloadPresent()).toBe(true, `Download is not displayed for ${folder1}`);
      // enable when ACA-1737 is done
      // expect(await contextMenu.isEditPresent()).toBe(false, `Edit is displayed for ${folder1}`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${folder1}`);
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed for ${folder1}`);
      // TODO: enable when ACA-1737 is done
      // expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed for ${folder1}`);
      // expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed for ${folder1}`);
      // TODO: enable when ACA-1794 is fixed
      // expect(await contextMenu.isManagePermissionsPresent()).toBe(true, `Permissions is not displayed for ${folder1}`);
      expect(await contextMenu.isViewPresent()).toBe(false, `View is displayed for ${folder1}`);
      expect(await contextMenu.isManageVersionsPresent()).toBe(false, `Manage Versions is displayed for ${folder1}`);
      expect(await contextMenu.isSharePresent()).toBe(false, `Share is displayed for ${folder1}`);
    });

    it('on Search Results - [C291830]', async () => {
      await searchInput.clickSearchButton();
      await searchInput.checkOnlyFolders();
      await searchInput.searchForTextAndCloseSearchOptions(folder1);
      await dataTable.rightClickOnItem(folder1);
      expect(await contextMenu.isDownloadPresent()).toBe(true, `Download is not displayed for ${folder1}`);
      expect(await contextMenu.isEditPresent()).toBe(false, `Edit is displayed for ${folder1}`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed for ${folder1}`);
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed for ${folder1}`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed for ${folder1}`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed for ${folder1}`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed for ${folder1}`);
      expect(await contextMenu.isViewPresent()).toBe(false, `View is displayed for ${folder1}`);
      expect(await contextMenu.isManageVersionsPresent()).toBe(false, `Manage Versions displayed for ${folder1}`);
      expect(await contextMenu.isSharePresent()).toBe(false, `Share is displayed for ${folder1}`);
    });
  });

  describe('context menu actions are correct for multiple selection of files - consumer', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('on File Libraries - [C280647]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.selectMultipleItems([file1, file2]);
      await dataTable.rightClickOnMultipleSelection();
      expect(await contextMenu.isViewPresent()).toBe(false, 'View is displayed');
      expect(await contextMenu.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
    });

    it('on Shared Files - [C286283]', async () => {
      await page.clickSharedFilesAndWait();
      await dataTable.selectMultipleItems([file1, file2]);
      await dataTable.rightClickOnMultipleSelection();
      expect(await contextMenu.isViewPresent()).toBe(false, 'View is displayed');
      expect(await contextMenu.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
    });

    it('on Favorites - [C286280]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.selectMultipleItems([file1, file2]);
      await dataTable.rightClickOnMultipleSelection();
      expect(await contextMenu.isViewPresent()).toBe(false, 'View is displayed');
      expect(await contextMenu.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      // TODO: enable when ACA-1737 is done
      // expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed`);
      // expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
    });

    it('on Search Results - [C291834]', async () => {
      await searchInput.clickSearchButton();
      await searchInput.checkOnlyFiles();
      await searchInput.searchForTextAndCloseSearchOptions('my-file');
      await dataTable.selectMultipleItems([file1, file2]);
      await dataTable.rightClickOnMultipleSelection();

      expect(await contextMenu.isViewPresent()).toBe(false, 'View is displayed');
      expect(await contextMenu.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
    });
  });

  describe('context menu actions are correct for multiple selection of folders - consumer', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('on File Libraries - [C280666]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.selectMultipleItems([folder1, folder2]);
      await dataTable.rightClickOnMultipleSelection();
      expect(await contextMenu.isViewPresent()).toBe(false, 'View is displayed');
      expect(await contextMenu.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
    });

    it('on Favorites - [C286281]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.selectMultipleItems([folder1, folder2]);
      await dataTable.rightClickOnMultipleSelection();
      expect(await contextMenu.isViewPresent()).toBe(false, 'View is displayed');
      expect(await contextMenu.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      // TODO: enable when ACA-1737 is done
      // expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed`);
      // expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
    });

    it('on Search Results - [C291835]', async () => {
      await searchInput.clickSearchButton();
      await searchInput.checkOnlyFolders();
      await searchInput.searchForTextAndCloseSearchOptions('my-folder');
      await dataTable.selectMultipleItems([folder1, folder2]);
      await dataTable.rightClickOnMultipleSelection();

      expect(await contextMenu.isViewPresent()).toBe(false, 'View is displayed');
      expect(await contextMenu.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
    });
  });

  describe('context menu actions are correct when both files and folders are selected - consumer', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('on File Libraries - [C280669]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.selectMultipleItems([file1, folder1]);
      await dataTable.rightClickOnMultipleSelection();
      expect(await contextMenu.isViewPresent()).toBe(false, 'View is displayed');
      expect(await contextMenu.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
    });

    it('on Favorites - [C286282]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.selectMultipleItems([file1, folder1]);
      await dataTable.rightClickOnMultipleSelection();
      expect(await contextMenu.isViewPresent()).toBe(false, 'View is displayed');
      expect(await contextMenu.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      // TODO: enable when ACA-1737 is done
      // expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed`);
      // expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
    });

    it('on Search Results - [C291836]', async () => {
      await searchInput.clickSearchButton();
      await searchInput.checkFilesAndFolders();
      await searchInput.searchForTextAndCloseSearchOptions('my-f');
      await dataTable.selectMultipleItems([file1, folder1]);
      await dataTable.rightClickOnMultipleSelection();

      expect(await contextMenu.isViewPresent()).toBe(false, 'View is displayed');
      expect(await contextMenu.isDownloadPresent()).toBe(true, 'Download is not displayed');
      expect(await contextMenu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await contextMenu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await contextMenu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await contextMenu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await contextMenu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
    });
  });

  describe('toolbar actions appear correctly in the viewer - consumer', () => {
    beforeEach(async (done) => {
      await Utils.pressEscape();
      await dataTable.clearSelection();
      await page.clickPersonalFiles();
      done();
    });

    it('file from File Libraries - [C268128]', async () => {
      await page.clickFileLibrariesAndWait();
      await dataTable.doubleClickOnRowByName(siteName);
      await dataTable.waitForHeader();
      await dataTable.doubleClickOnRowByName(docxFile);
      expect(await viewer.isViewerOpened()).toBe(true, 'Viewer is not opened');

      expect(await viewerToolbar.isEmpty()).toBe(false, `viewer toolbar is empty`);
      expect(await viewerToolbar.isViewPresent()).toBe(false, `View is displayed`);
      expect(await viewerToolbar.isDownloadPresent()).toBe(true, `Download is not displayed`);
      expect(await viewerToolbar.isPrintPresent()).toBe(true, `Print is not displayed`);
      expect(await viewerToolbar.isFullScreenPresent()).toBe(true, `Full screen is not displayed`);
      expect(await viewerToolbar.isSharedLinkSettingsPresent()).toBe(true, 'Shared link settings is not displayed');
      expect(await viewerToolbar.isViewDetailsPresent()).toBe(true, `View details is not displayed`);
      await viewerToolbar.openMoreMenu();
      expect(await viewerToolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await viewerToolbar.menu.isSharePresent()).toBe(false, `Share is displayed in More actions`);
      expect(await viewerToolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await viewerToolbar.menu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await viewerToolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await viewerToolbar.menu.isManageVersionsPresent()).toBe(true, `Manage versions is displayed`);
      expect(await viewerToolbar.menu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
      await toolbar.closeMoreMenu();
    });

    it('file from Shared Files - [C286310]', async () => {
      await page.clickSharedFilesAndWait();
      await dataTable.doubleClickOnRowByName(docxFile);
      expect(await viewer.isViewerOpened()).toBe(true, 'Viewer is not opened');

      expect(await viewerToolbar.isEmpty()).toBe(false, `viewer toolbar is empty`);
      expect(await viewerToolbar.isViewPresent()).toBe(false, `View is displayed`);
      expect(await viewerToolbar.isDownloadPresent()).toBe(true, `Download is not displayed`);
      expect(await viewerToolbar.isPrintPresent()).toBe(true, `Print is not displayed`);
      expect(await viewerToolbar.isFullScreenPresent()).toBe(true, `Full screen is not displayed`);
      expect(await viewerToolbar.isViewDetailsPresent()).toBe(true, `View details is not displayed`);
      await viewerToolbar.openMoreMenu();
      expect(await viewerToolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await viewerToolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      expect(await viewerToolbar.menu.isMovePresent()).toBe(false, `Move is displayed`);
      expect(await viewerToolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await viewerToolbar.menu.isManageVersionsPresent()).toBe(true, `Manage versions is displayed`);
      expect(await viewerToolbar.menu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
      await toolbar.closeMoreMenu();
    });

    it('file from Favorites - [C286311]', async () => {
      await page.clickFavoritesAndWait();
      await dataTable.doubleClickOnRowByName(docxFile);
      expect(await viewer.isViewerOpened()).toBe(true, 'Viewer is not opened');

      expect(await viewerToolbar.isEmpty()).toBe(false, `viewer toolbar is empty`);
      expect(await viewerToolbar.isViewPresent()).toBe(false, `View is displayed`);
      expect(await viewerToolbar.isDownloadPresent()).toBe(true, `Download is not displayed`);
      expect(await viewerToolbar.isPrintPresent()).toBe(true, `Print is not displayed`);
      expect(await viewerToolbar.isFullScreenPresent()).toBe(true, `Full screen is not displayed`);
      expect(await viewerToolbar.isSharedLinkSettingsPresent()).toBe(true, 'Shared link settings is not displayed');
      expect(await viewerToolbar.isViewDetailsPresent()).toBe(true, `View details is not displayed`);
      await viewerToolbar.openMoreMenu();
      expect(await viewerToolbar.menu.isFavoritePresent()).toBe(true, `Favorite is not displayed`);
      expect(await viewerToolbar.menu.isSharePresent()).toBe(false, `Share is displayed in More actions`);
      expect(await viewerToolbar.menu.isCopyPresent()).toBe(true, `Copy is not displayed`);
      // TODO: enable when ACA-1737 is done
      // expect(await viewerToolbar.menu.isMovePresent()).toBe(false, `Move is displayed`);
      // expect(await viewerToolbar.menu.isDeletePresent()).toBe(false, `Delete is displayed`);
      expect(await viewerToolbar.menu.isManageVersionsPresent()).toBe(true, `Manage versions is displayed`);
      expect(await viewerToolbar.menu.isManagePermissionsPresent()).toBe(false, `Permissions is displayed`);
      await toolbar.closeMoreMenu();
    });
  });
});